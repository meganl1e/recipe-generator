/**
 * Server-only Strapi helpers. Use in API routes, Server Actions, getServerSideProps, etc.
 * Do not import in client components (token must stay on server).
 */

import type { IAafcoNutrient, IGrublifyPack, IIngredient, INutrientValue } from "@/types";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;


// headers we send to the Strapi API
// basically putting the token we need to access aafco
function getStrapiHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (STRAPI_TOKEN) {
    headers["Authorization"] = `Bearer ${STRAPI_TOKEN}`;
  }
  return headers;
}

/**
 * Fetch from a Strapi API path using the server-side API token.
 * Use for private content (e.g. AAFCO guidelines) that has no Public permission.
 *
 * @param path - API path without base URL, e.g. "aafco-nutrients" or "aafco-nutrient"
 * @returns Strapi response (v4 shape: { data, meta } for collection, { data } for single)
 */
export async function fetchStrapi<T = unknown>(
  path: string,
  searchParams?: Record<string, string>
): Promise<{ data: T; meta?: { pagination?: unknown } }> {
  if (!STRAPI_URL) {
    throw new Error("NEXT_PUBLIC_STRAPI_URL is not set");
  }

  // Full URL: STRAPI_URL + /api/ + path (e.g. .../api/aafco-nutrient)
  // searchParams must be Record<string, string> so URLSearchParams serializes correctly (Strapi expects string query params).
  let url = `${STRAPI_URL.replace(/\/$/, "")}/api/${path.replace(/^\//, "")}`;
  if (searchParams && Object.keys(searchParams).length > 0) {
    url += `?${new URLSearchParams(searchParams as Record<string, string>).toString()}`;
  }
  const res = await fetch(url, {
    headers: getStrapiHeaders(),
    // Prevent caching so you always get fresh data in dev; adjust for production if needed
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Strapi error ${res.status}: ${res.statusText} for ${url}`);
  }

  return res.json();
}

/**
 * Example: fetch all AAFCO nutrient guidelines (collection type).
 * Strapi collection endpoints use the plural name, e.g. /api/aafco-nutrients
 */

// i believe this is for a collection type, for aafco nutrients it is a single type 
// export async function getAafcoNutrients() {
//   const json = await fetchStrapi<Array<{ id: number; attributes: Record<string, unknown> }>>(
//     "aafco-nutrients"
//   );
//   return json.data ?? [];
// }

/**
 * Flatten one AAFCO nutrient entry from Strapi v4 shape (id + attributes) to IAafcoNutrient.
 * Strapi v4 returns component entries as { id, attributes: { name, value, min, max, unit, notes } }.
 */
function flattenAafcoNutrientEntry(raw: Record<string, unknown>): IAafcoNutrient {
  const attrs = (raw.attributes as Record<string, unknown>) ?? raw;
  const get = (key: string) => attrs[key] ?? raw[key];
  const num = (key: string, def: number | null) => {
    const v = get(key);
    return v != null && v !== "" ? Number(v) : def;
  };
  const str = (key: string, def: string | null): string | null => {
    const v = get(key);
    if (v == null || v === "") return def;
    return String(v);
  };
  return {
    id: num("id", 0) ?? 0,
    name: String(get("name") ?? ""),
    value: str("value", null),
    min: num("min", null),
    max: num("max", null),
    unit: String(get("unit") ?? "g"),
    notes: str("notes", null),
  };
}

/**
 * Fetch AAFCO nutrient guidelines (single type). Returns the nutrient entries array for formulation.
 * Single-type endpoint: /api/aafco-nutrient. Populate so the nutrient component is included.
 * Normalizes Strapi v4 response (attributes wrapper) so name/value/min/max are top-level.
 */
export async function getAafcoNutrient(): Promise<IAafcoNutrient[]> {
  const json = await fetchStrapi<Record<string, unknown>>("aafco-nutrient", {
    populate: "nutrient",
  } as Record<string, string>);
  const data = json.data as Record<string, unknown> | undefined;
  const fromAttrs = (data?.attributes as Record<string, unknown> | undefined)?.nutrient;
  const fromTop = data?.nutrient;
  const rawList = Array.isArray(fromAttrs) ? fromAttrs : Array.isArray(fromTop) ? fromTop : [];
  return (rawList as Array<Record<string, unknown>>).map((item) =>
    flattenAafcoNutrientEntry(item)
  );
}


/**
 * Raw Strapi response for grublify-nutrition-pack. Adjust if your Strapi schema differs.
 * Nutrients may be stored as an array (e.g. [{ name, unit, amount }]) or as an object.
 */
type StrapiGrublifyPackRaw = {
  id?: number;
  documentId?: string;
  attributes?: {
    nutrients?: Record<string, { unit?: string; amount?: number }> | Array<{ name: string; unit: string; amount: number }>;
    per100g?: boolean;
  };
  nutrients?: Record<string, { unit?: string; amount?: number }> | Array<{ name: string; unit: string; amount: number }>;
};

/**
 * Normalize Strapi nutrients into a flat map for formulation.
 * - Object form (your Strapi): { crudeProtein: { amount, unit }, calcium: { amount, unit }, ... }
 *   → Keys are used as nutrient names (e.g. "crudeProtein", "calcium"). AAFCO "value" must match these (case-insensitive).
 * - Array form: [{ name, unit, amount }, ...] → "name" becomes the key.
 */
function normalizeNutrients(
  raw: Record<string, { unit?: string; amount?: number | null; note?: string; missing?: boolean }> | Array<{ name: string; unit: string; amount: number }> | undefined
): Record<string, INutrientValue> {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    return raw.reduce<Record<string, INutrientValue>>((acc, n) => {
      const name = (n as { name?: string }).name ?? String(n);
      acc[name] = {
        unit: (n as { unit?: string }).unit ?? "g",
        amount: Number((n as { amount?: number }).amount) || 0,
      };
      return acc;
    }, {});
  }
  const out: Record<string, INutrientValue> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val && typeof val === "object" && "amount" in val)
      out[key] = { unit: String(val.unit ?? "g"), amount: Number(val.amount) || 0 };
  }
  return out;
}

/** AAFCO-derived nutrients: each slot is alternatives (use first match); derived = sum of slots. */
const DERIVED_NUTRIENTS: Array<{ derivedKey: string; slots: string[][] }> = [
  { derivedKey: "methionineCystine", slots: [["methionine"], ["cystine"]] },
  { derivedKey: "phenylalanineTyrosine", slots: [["phenylalanine"], ["tyrosine"]] },
];

function amountFrom(nutrients: Record<string, INutrientValue>, key: string): number {
  const val = nutrients[key];
  return val != null ? Number(val.amount) || 0 : 0;
}

function findKey(nutrients: Record<string, INutrientValue>, alternatives: string[]): string | null {
  for (const alt of alternatives) {
    const key = Object.keys(nutrients).find((k) => k.toLowerCase() === alt.toLowerCase());
    if (key) return key;
  }
  return null;
}

/** Add AAFCO-derived nutrients (e.g. Methionine + Cystine) to a nutrients map. Mutates and returns the same object. */
function addDerivedNutrients(nutrients: Record<string, INutrientValue>): Record<string, INutrientValue> {
  for (const { derivedKey, slots } of DERIVED_NUTRIENTS) {
    if (nutrients[derivedKey] != null) continue;
    let sum = 0;
    for (const slot of slots) {
      const key = findKey(nutrients, slot);
      if (key) sum += amountFrom(nutrients, key);
    }
    if (sum > 0 || slots.some((slot) => findKey(nutrients, slot))) {
      nutrients[derivedKey] = { unit: "g", amount: sum };
    }
  }
  return nutrients;
}

/**
 * Fetch Grublify pack from Strapi Cloud (server-only).
 * Returns nutrients in the same format as ingredient nutrients for formulation.
 * Only call from API routes or Server Actions; never expose to the client.
 */
export async function getGrublifyPack(): Promise<IGrublifyPack | null> {
  const json = await fetchStrapi<StrapiGrublifyPackRaw>("grublify-nutrition-pack", {
    populate: "*",
  } as Record<string, string>);

  const data = json.data;
  if (!data) return null;

  const attrs = data.attributes ?? {};
  const rawNutrients = attrs.nutrients ?? (data as StrapiGrublifyPackRaw).nutrients;
  let nutrients = normalizeNutrients(rawNutrients);
  nutrients = addDerivedNutrients(nutrients);
  const per100g = attrs.per100g !== false;

  return { nutrients, per100g };
}

/** Strapi v4 wraps fields in attributes; flatten to match IIngredient. Handles both nested and flat responses. */
function flattenIngredient(raw: Record<string, unknown>): IIngredient {
  const attrs = (raw.attributes as Record<string, unknown>) ?? raw;
  const get = (key: string) => attrs[key] ?? raw[key];
  const num = (key: string, def: number) => (get(key) != null ? Number(get(key)) : def);
  const str = (key: string, def: string) => String(get(key) ?? def);
  const nutrientsRaw = get("nutrients");
  let nutrients = normalizeNutrients(
    nutrientsRaw as Record<string, { unit?: string; amount?: number }> | Array<{ name: string; unit: string; amount: number }>
  ) as Record<string, INutrientValue>;
  nutrients = addDerivedNutrients(nutrients);
  const allergensRaw = get("allergens");
  const allergens = (Array.isArray(allergensRaw) ? allergensRaw : []).map(String);

  return {
    id: num("id", 0),
    documentId: str("documentId", ""),
    name: str("name", ""),
    description: str("description", ""),
    usdaFdcId: num("usdaFdcId", 0),
    calories: get("calories") != null ? Number(get("calories")) : undefined,
    nutrients,
    allergens,
    per100g: get("per100g") !== false,
    category: str("category", ""),
    yield: num("yield", 1),
  };
}

export async function getIngredients(): Promise<IIngredient[]> {
  const json = await fetchStrapi<Array<Record<string, unknown>>>(
    "ingredients",
    { "pagination[pageSize]": "100" }
  );
  const data = json.data ?? [];
  return data.map((item) => flattenIngredient(item));
}
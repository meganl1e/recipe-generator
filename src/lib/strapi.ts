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
 * Fetch AAFCO nutrient guidelines (single type). Returns the nutrient entries array for formulation.
 * Single-type endpoint: /api/aafco-nutrient. Populate so the nutrient component is included.
 */
export async function getAafcoNutrient(): Promise<IAafcoNutrient[]> {
  const json = await fetchStrapi<{ nutrient: IAafcoNutrient[] }>("aafco-nutrient", {
    populate: "nutrient",
  } as Record<string, string>);
  return json.data?.nutrient ?? [];
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

function normalizeNutrients(
  raw: Record<string, { unit?: string; amount?: number }> | Array<{ name: string; unit: string; amount: number }> | undefined
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
  const nutrients = normalizeNutrients(rawNutrients);
  const per100g = attrs.per100g !== false;

  return { nutrients, per100g };
}

export async function getIngredients() {
  const json = await fetchStrapi<IIngredient[]>(
    "ingredients",
    { "pagination[pageSize]": "100" }
  );
  return json.data ?? [];
}
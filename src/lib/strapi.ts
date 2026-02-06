/**
 * Server-only Strapi helpers. Use in API routes, Server Actions, getServerSideProps, etc.
 * Do not import in client components (token must stay on server).
 */

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
  let url = `${STRAPI_URL.replace(/\/$/, "")}/api/${path.replace(/^\//, "")}`;
  if (searchParams && Object.keys(searchParams).length > 0) {
    url += `?${new URLSearchParams(searchParams).toString()}`;
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
 * Example: fetch a single AAFCO resource (single type).
 * Single-type endpoint is singular, e.g. /api/aafco-nutrient
 */
export async function getAafcoNutrient() {
  const json = await fetchStrapi<{ id: number; attributes: Record<string, unknown> }>(
    "aafco-nutrient",
    // Include the nutrients component. If still missing, try: { "populate[nutrients]": "*" }
    { populate: "*" }
  );
  return json.data ?? null;
}


export async function getIngredients() {
  const json = await fetchStrapi(
    "ingredients"
  );
  return json.data ?? null;
}
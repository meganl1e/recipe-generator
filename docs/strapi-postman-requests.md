# Strapi requests (same as the app uses)

Use these in Postman to see exactly what the recipe generator fetches from Strapi. Replace placeholders with your real values from `.env.local`:

- `STRAPI_URL` → e.g. `https://your-strapi.cloud` or `http://localhost:1337`
- `STRAPI_API_TOKEN` → your Strapi API token (same as `STRAPI_API_TOKEN` in env)

**Headers (all three requests):**

| Key             | Value                    |
|-----------------|--------------------------|
| Content-Type    | application/json         |
| Authorization   | Bearer YOUR_STRAPI_TOKEN |

---

## 1. AAFCO nutrients (single type)

**Method:** GET  
**URL:**

```
{{STRAPI_URL}}/api/aafco-nutrient?populate=nutrient
```

**Example:**

```
https://your-strapi.cloud/api/aafco-nutrient?populate=nutrient
```

The app reads the **nutrient** array from the response (either `data.attributes.nutrient` or `data.nutrient`). Each entry should have **name** and **value** (the compare string). Check that your updated `value` fields appear here.

---

## 2. Ingredients (collection, page 1)

**Method:** GET  
**URL:**

```
{{STRAPI_URL}}/api/ingredients?pagination[page]=1&pagination[pageSize]=100&pagination[withCount]=true
```

**Example:**

```
https://your-strapi.cloud/api/ingredients?pagination[page]=1&pagination[pageSize]=100&pagination[withCount]=true
```

The app loops pages until `page > meta.pagination.pageCount`. Each item’s **nutrients** are read from `data[i].attributes.nutrient` or `data[i].nutrients` (object keys = nutrient keys). Check that your ingredient nutrient keys appear inside each ingredient’s `attributes.nutrients` (or top-level `nutrients`).

---

## 3. Grublify nutrition pack (single type)

**Method:** GET  
**URL:**

```
{{STRAPI_URL}}/api/grublify-nutrition-pack?populate=*
```

**Example:**

```
https://your-strapi.cloud/api/grublify-nutrition-pack?populate=*
```

The app reads **nutrients** from `data.attributes.nutrients` or `data.nutrients`. Same key structure as ingredients.

---

## Quick checklist

1. **AAFCO:** Open the aafco-nutrient response → find the `nutrient` array → confirm each object has the **value** you set in Strapi (and that it’s not only under `attributes.value` with nothing at top level).
2. **Ingredients:** Open the ingredients response → pick one entry → confirm **nutrients** is present and is an object whose **keys** are your nutrient names (e.g. `crudeProtein`, `calcium`).
3. If any of these return 401, the token is wrong or the content type isn’t allowed for that token. If 403, check Strapi permissions for that API token.

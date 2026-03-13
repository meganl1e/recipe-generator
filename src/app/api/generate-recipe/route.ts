/**
 * API Route: POST /api/generate-recipe
 * 
 * This is a SERVER-ONLY endpoint. It runs on your Next.js server (not in the browser).
 * 
 * What it does:
 * 1. Receives user input from the browser (daily calories, selected ingredients, exclusions)
 * 2. Fetches AAFCO guidelines, ingredients, and Grublify pack from Strapi (server-side only)
 * 3. Filters out excluded ingredients/allergens
 * 4. Runs formulation logic to create a recipe that meets AAFCO standards
 * 5. Returns only the final recipe (never exposes AAFCO/Grublify raw data to client)
 */

import { NextResponse } from "next/server";
import { getAafcoNutrient, getIngredients, getGrublifyPack } from "@/lib/strapi";
import { formulateRecipe } from "@/lib/recipe-formulation";
import type { IIngredient } from "@/types";

function getCategory(ing: IIngredient): string {
  return ing.category?.trim() || "Other";
}

/** Max ingredients to pass to the solver so it has enough variety to meet AAFCO. */
const MAX_INGREDIENTS_FOR_SOLVER = 30;

/**
 * Build the ingredient set for the recipe:
 * - User-selected ingredients (if any) from the pool.
 * - At least one ingredient from every category in the pool.
 * - Then fill up to MAX_INGREDIENTS_FOR_SOLVER with more from the pool (random) so the solver has options.
 */
function buildIngredientSet(
  pool: IIngredient[],
  selectedIngredientIds: string[]
): IIngredient[] {
  const byCategory = new Map<string, IIngredient[]>();
  for (const ing of pool) {
    const cat = getCategory(ing);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(ing);
  }

  const result: IIngredient[] = [];
  const resultIds = new Set<string>();

  // 1) Add user-selected ingredients that are in the pool
  for (const id of selectedIngredientIds) {
    const ing = pool.find((i) => i.documentId === id);
    if (ing && !resultIds.has(id)) {
      result.push(ing);
      resultIds.add(id);
    }
  }

  // 2) Ensure at least one from each category (fill missing categories; pick randomly)
  for (const [cat, list] of byCategory) {
    if (result.some((ing) => getCategory(ing) === cat)) continue;
    const available = list.filter((i) => !resultIds.has(i.documentId));
    if (available.length === 0) continue;
    const ing = available[Math.floor(Math.random() * available.length)];
    result.push(ing);
    resultIds.add(ing.documentId);
  }

  // 3) Add more from pool up to MAX_INGREDIENTS_FOR_SOLVER so the solver has variety to meet AAFCO
  const remaining = pool.filter((i) => !resultIds.has(i.documentId));
  const need = Math.max(0, MAX_INGREDIENTS_FOR_SOLVER - result.length);
  if (need > 0 && remaining.length > 0) {
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(need, shuffled.length); i++) {
      result.push(shuffled[i]);
      resultIds.add(shuffled[i].documentId);
    }
  }

  return result;
}

/**
 * TypeScript type for the request body that the client will send
 * This defines what data we expect to receive from the browser
 */
interface GenerateRecipeRequest {
  dailyKcal: number;
  selectedIngredientIds: string[];
  excludedAllergens: string[];
  excludedIngredientIds: string[];
  mealsPerDay?: number;
}

/**
 * TypeScript type for the response we'll send back to the client
 * This defines what data the browser will receive
 */
interface GenerateRecipeResponse {
  /** Ingredients that were passed to the solver for this run */
  ingredientsUsed: Array<{ documentId: string; name: string }>;
  /** The batch recipe (total amounts for all ingredients) */
  batch: {
    /** List of ingredients with their amounts in grams */
    ingredients: Array<{
      documentId: string;
      name: string;
      grams: number;
    }>;
    /** Optional: amount of Grublify pack to add (in grams) */
    grublifyGrams?: number;
    totalGrams: number;
    totalKcal: number;
  };
  feeding: {
    perMealGrams: number;
    mealsPerDay: number;
  };
  /** True when LP solver failed and we fell back to heuristic (equal proportions + Grublify for shortfalls) */
  usedFallback?: boolean;
  /**
   * When present, shows how AAFCO guideline strings mapped to ingredient / Grublify nutrient keys.
   * If skippedDueToNutrientMismatch is true, the batch recipe will be empty and this is what the
   * UI should display instead so the user can align names.
   */
  debugNutrientMapping?: {
    aafcoCompareStrings: string[];
    ingredientNutrientKeys: string[];
    grublifyNutrientKeys: string[];
    matches: Array<{ aafcoCompare: string; matchedKey: string | null }>;
    noMatch: string[];
  };
  /** True when formulation was skipped because at least one AAFCO guideline did not match any key. */
  skippedDueToNutrientMismatch?: boolean;
}

/**
 * POST handler - this function runs when the browser sends a POST request to /api/generate-recipe
 * 
 * In Next.js App Router, you export named functions like POST, GET, etc.
 * The function name matches the HTTP method you want to handle.
 */
export async function POST(request: Request) {
  try {
    // ============================================
    // STEP 1: Parse the request body
    // ============================================
    // The browser sends JSON data in the request body
    // We need to read it and convert it from JSON string to JavaScript object
    const body: GenerateRecipeRequest = await request.json();

    // Validate that we got the required data
    if (!body.dailyKcal || body.dailyKcal <= 0) {
      return NextResponse.json(
        { error: "dailyKcal is required and must be greater than 0" },
        { status: 400 } // 400 = Bad Request (client sent invalid data)
      );
    }

    // Extract the data with defaults
    const {
      dailyKcal,
      selectedIngredientIds = [],
      excludedAllergens = [],
      excludedIngredientIds = [],
      mealsPerDay = 2, // Default to 2 meals per day if not specified
    } = body;

    // ============================================
    // STEP 2: Fetch data from Strapi (SERVER-ONLY)
    // ============================================
    // These functions use your STRAPI_API_TOKEN which is only available on the server
    // The browser NEVER sees these calls or the data they return
    
    const aafcoGuidelines = await getAafcoNutrient();
    const allIngredients = await getIngredients();
    const grublifyPack = await getGrublifyPack();

    // ============================================
    // STEP 3: Filter ingredients and decide which to use
    // ============================================
    // Build a pool: all ingredients minus excluded allergens and excluded ingredient IDs.
    // If the user selected some IDs, use those from the pool. If none selected, we pick a default set (by category).

    let pool = [...allIngredients];

    if (excludedAllergens.length > 0) {
      pool = pool.filter((ing) => {
        const hasExcludedAllergen = ing.allergens?.some((allergen) =>
          excludedAllergens.includes(allergen.trim())
        );
        return !hasExcludedAllergen;
      });
    }

    if (excludedIngredientIds.length > 0) {
      pool = pool.filter((ing) => !excludedIngredientIds.includes(ing.documentId));
    }

    if (pool.length === 0) {
      return NextResponse.json(
        { error: "No ingredients available after applying filters" },
        { status: 400 }
      );
    }

    // At least one ingredient from each category; include user selections; fill to maxCount
    const availableIngredients = buildIngredientSet(pool, selectedIngredientIds);

    // ============================================
    // STEP 4: Run formulation logic
    // ============================================
    const result = formulateRecipe(aafcoGuidelines, availableIngredients, grublifyPack, {
      dailyKcal,
      mealsPerDay,
    });

    if (result.error) {
      const ingredientsUsedForError = [
        ...availableIngredients.map((i) => ({ documentId: i.documentId, name: i.name })),
        ...(grublifyPack ? [{ documentId: "grublify-pack", name: "Grublify pack" }] : []),
      ];
      return NextResponse.json(
        {
          error: result.error,
          lpDiagnostics: result.lpDiagnostics,
          ingredientsUsed: ingredientsUsedForError,
        },
        { status: 422 }
      );
    }

    const batchIngredients = [
      ...result.ingredients,
      ...(grublifyPack
        ? [{ documentId: "grublify-pack", name: "Grublify pack", grams: result.grublifyGrams ?? 0 }]
        : []),
    ].filter((item) => item.grams > 0.01);

    const ingredientsUsed = batchIngredients.map((item) => ({
      documentId: item.documentId,
      name: item.name,
    }));

    const recipe: GenerateRecipeResponse = {
      ingredientsUsed,
      batch: {
        ingredients: batchIngredients,
        ...(result.grublifyGrams != null && result.grublifyGrams > 0.01 && { grublifyGrams: result.grublifyGrams }),
        totalGrams: result.totalGrams,
        totalKcal: result.totalKcal,
      },
      feeding: {
        perMealGrams: result.perMealGrams,
        mealsPerDay,
      },
      ...(result.usedFallback && { usedFallback: true }),
      ...(result.debugNutrientMapping && {
        debugNutrientMapping: result.debugNutrientMapping,
      }),
      ...(result.skippedDueToNutrientMismatch && {
        skippedDueToNutrientMismatch: true,
      }),
    };

    // ============================================
    // STEP 5: Return the recipe to the client
    // ============================================
    // NextResponse.json() converts your JavaScript object to JSON
    // and sends it back to the browser with the right headers
    return NextResponse.json(recipe);

    // ============================================
    // ERROR HANDLING
    // ============================================
    // If anything goes wrong, catch the error and return a friendly message
    // Never expose internal errors (like Strapi URLs or tokens) to the client
  } catch (error) {
    console.error("Recipe generation failed:", error);
    
    // Return a generic error message to the client
    // Don't leak internal details (like "Strapi error 500" or token issues)
    return NextResponse.json(
      { error: "Failed to generate recipe. Please try again." },
      { status: 500 } // 500 = Internal Server Error
    );
  }
}

/**
 * OPTIONAL: You can also add a GET handler if you want to test the endpoint
 * But for this use case, we only need POST since we're sending data from the browser
 */
// export async function GET() {
//   return NextResponse.json(
//     { message: "Use POST to generate a recipe" },
//     { status: 405 } // 405 = Method Not Allowed
//   );
// }

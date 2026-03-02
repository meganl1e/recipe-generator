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
// TODO: Import these functions once they exist
// import { getAafcoNutrient, getIngredients, getGrublifyPack } from "@/lib/strapi";
// import { formulateRecipe } from "@/lib/recipe-formulation";
import type { IIngredient } from "@/types";

/**
 * TypeScript type for the request body that the client will send
 * This defines what data we expect to receive from the browser
 */
interface GenerateRecipeRequest {
  /** Daily calories the dog needs (from dog details form) */
  dailyKcal: number;
  /** Array of ingredient documentIds that the user selected */
  selectedIngredientIds: string[];
  /** Array of allergen names to exclude (e.g. ["chicken", "beef"]) */
  excludedAllergens: string[];
  /** Array of ingredient documentIds to exclude */
  excludedIngredientIds: string[];
  /** Optional: number of meals per day (defaults to 2 if not provided) */
  mealsPerDay?: number;
}

/**
 * TypeScript type for the response we'll send back to the client
 * This defines what data the browser will receive
 */
interface GenerateRecipeResponse {
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
    /** Total weight of the batch in grams */
    totalGrams: number;
    /** Total calories in the batch */
    totalKcal: number;
  };
  /** Per-meal feeding instructions */
  feeding: {
    /** How many grams to feed per meal */
    perMealGrams: number;
    /** How many meals per day */
    mealsPerDay: number;
  };
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
    
    // TODO: Uncomment these once the functions exist
    // const aafcoGuidelines = await getAafcoNutrient();
    // const allIngredients = await getIngredients();
    // const grublifyPack = await getGrublifyPack();
    
    // For now, we'll use placeholder data so you can see the structure
    const aafcoGuidelines: any[] = []; // TODO: Replace with actual fetch
    const allIngredients: IIngredient[] = []; // TODO: Replace with actual fetch
    const grublifyPack: any = null; // TODO: Replace with actual fetch

    // ============================================
    // STEP 3: Filter ingredients based on user selections
    // ============================================
    // We need to:
    // - Use selected ingredients if provided, otherwise use all ingredients
    // - Remove ingredients that contain excluded allergens
    // - Remove ingredients that are in the excluded list

    let availableIngredients: IIngredient[];

    if (selectedIngredientIds.length > 0) {
      // User selected specific ingredients - only use those
      availableIngredients = allIngredients.filter((ing) =>
        selectedIngredientIds.includes(ing.documentId)
      );
    } else {
      // User didn't select any - use all ingredients
      availableIngredients = [...allIngredients];
    }

    // Filter out ingredients that contain excluded allergens
    if (excludedAllergens.length > 0) {
      availableIngredients = availableIngredients.filter((ing) => {
        // Check if this ingredient has any of the excluded allergens
        const hasExcludedAllergen = ing.allergens?.some((allergen) =>
          excludedAllergens.includes(allergen.trim())
        );
        return !hasExcludedAllergen; // Keep ingredients that DON'T have excluded allergens
      });
    }

    // Filter out ingredients that are explicitly excluded
    if (excludedIngredientIds.length > 0) {
      availableIngredients = availableIngredients.filter(
        (ing) => !excludedIngredientIds.includes(ing.documentId)
      );
    }

    // Check if we have any ingredients left after filtering
    if (availableIngredients.length === 0) {
      return NextResponse.json(
        { error: "No ingredients available after applying filters" },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 4: Run formulation logic
    // ============================================
    // This is where the magic happens - calculating ingredient amounts
    // to meet AAFCO standards. This will be in a separate file (recipe-formulation.ts)
    
    // TODO: Uncomment once formulateRecipe exists
    // const recipe = await formulateRecipe({
    //   aafcoGuidelines,
    //   ingredients: availableIngredients,
    //   grublifyPack,
    //   dailyKcal,
    //   mealsPerDay,
    // });

    // For now, return a placeholder response so you can see the structure
    const recipe: GenerateRecipeResponse = {
      batch: {
        ingredients: [],
        totalGrams: 0,
        totalKcal: 0,
      },
      feeding: {
        perMealGrams: 0,
        mealsPerDay,
      },
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

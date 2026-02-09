import RecipeGeneratorClient from "@/components/RecipeGenerator/RecipeGeneratorClient";
import type { IIngredient } from "@/types";
import { getIngredients } from "@/lib/strapi";

/**
 * Skeleton: ingredients come from the local placeholder below.
 * When ready, fetch from Strapi in this server component and pass to RecipeGeneratorClient:
 *
 *   1. Import: import { getIngredients } from "@/lib/strapi";
 *   2. Remove the local getIngredients() function and placeholder array below.
 *   3. In GeneratorPage, use: const ingredients = await getIngredients();
 */
// async function getIngredients(): Promise<IIngredient[]> {
//   // TODO: replace with Strapi fetch, e.g.:
//   // const res = await fetchStrapi<IIngredient[]>('ingredients');
//   // return res.data ?? [];
//   // Placeholder so the selector UI is visible; remove when using Strapi.
//   // (Cast needed because IIngredient has more required fields; real data comes from Strapi.)
//   return [
//     { id: 1, name: "Chicken" },
//     { id: 2, name: "Tomatoes" },
//     { id: 3, name: "Garlic" },
//     { id: 4, name: "Olive oil" },
//     { id: 5, name: "Onion" },
//     { id: 6, name: "Pasta" },
//     { id: 7, name: "Basil" },
//     { id: 8, name: "Lemon" },
//   ] as IIngredient[];
// }

export default async function GeneratorPage() {
  const ingredients = await getIngredients();
  // console.log(ingredients.length);

  return (
    <div className="min-h-screen bg-background py-12 px-5">
      <RecipeGeneratorClient ingredients={ingredients} />
    </div>
  );
}

import RecipeGeneratorClient from "@/components/RecipeGenerator/RecipeGeneratorClient";
import type { IIngredient } from "@/types";

/**
 * Skeleton: ingredients are empty here. When ready, fetch from Strapi in this
 * server component and pass to RecipeGeneratorClient, e.g.:
 *
 *   const { data } = await fetchStrapi<IIngredient[]>('ingredients');
 *   const ingredients = Array.isArray(data) ? data : [];
 */
async function getIngredients(): Promise<IIngredient[]> {
  // TODO: replace with Strapi fetch, e.g.:
  // const res = await fetchStrapi<...>('ingredients');
  // return res.data ?? [];
  // Placeholder so the selector UI is visible; remove when using Strapi.
  return [
    { id: 1, name: "Chicken" },
    { id: 2, name: "Tomatoes" },
    { id: 3, name: "Garlic" },
    { id: 4, name: "Olive oil" },
    { id: 5, name: "Onion" },
    { id: 6, name: "Pasta" },
    { id: 7, name: "Basil" },
    { id: 8, name: "Lemon" },
  ];
}

export default async function GeneratorPage() {
  const ingredients = await getIngredients();

  return (
    <div className="min-h-screen bg-background py-12 px-5">
      <RecipeGeneratorClient ingredients={ingredients} />
    </div>
  );
}

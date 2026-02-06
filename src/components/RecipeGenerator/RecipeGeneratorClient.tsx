"use client";

import React, { useState, useCallback } from "react";
import Container from "@/components/Container";
import IngredientSelector from "./IngredientSelector";
import type { IIngredient } from "@/types";

interface RecipeGeneratorClientProps {
  /** Pass ingredients from server (e.g. from Strapi). Empty array = skeleton/empty state. */
  ingredients: IIngredient[];
  loading?: boolean;
}

export default function RecipeGeneratorClient({
  ingredients,
  loading = false,
}: RecipeGeneratorClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const onToggle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleGenerate = () => {
    // No logic – just skeleton. Wire to your recipe generation later.
    const selected = ingredients.filter((i) => selectedIds.has(i.id));
    console.log("Generate recipes (skeleton)", { selectedIds: Array.from(selectedIds), selected });
  };

  return (
    <Container>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 manrope">
            Recipe Generator
          </h1>
          <p className="text-foreground-accent text-base">
            Choose ingredients you have, or leave them blank to discover any recipe.
          </p>
        </div>

        <section className="mb-8" aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading" className="sr-only">
            Select ingredients
          </h2>
          <IngredientSelector
            ingredients={ingredients}
            selectedIds={selectedIds}
            onToggle={onToggle}
            loading={loading}
          />
        </section>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-full bg-primary hover:bg-primary-accent text-foreground font-semibold px-10 py-4 text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Generate recipes
          </button>
        </div>
      </div>
    </Container>
  );
}

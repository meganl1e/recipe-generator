"use client";

import React, { useMemo, useState, useCallback } from "react";
import { HiXMark } from "react-icons/hi2";
import Container from "@/components/Container";
import IngredientSelector, { CATEGORY_ICONS } from "./IngredientSelector";
import type { IIngredient } from "@/types";
import { TbSalad } from "react-icons/tb";

interface RecipeGeneratorClientProps {
  /** Pass ingredients from server (e.g. from Strapi). Empty array = skeleton/empty state. */
  ingredients: IIngredient[];
  loading?: boolean;
}

export default function RecipeGeneratorClient({
  ingredients,
  loading = false,
}: RecipeGeneratorClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedAllergens, setExcludedAllergens] = useState<Set<string>>(new Set());
  const [excludedIngredientIds, setExcludedIngredientIds] = useState<Set<string>>(new Set());

  const onToggle = useCallback((documentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  }, []);

  const onToggleExclude = useCallback((documentId: string) => {
    setExcludedIngredientIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  }, []);

  const onToggleAllergen = useCallback((allergen: string) => {
    const key = allergen.trim();
    setExcludedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const uniqueAllergens = useMemo(() => {
    const set = new Set<string>();
    for (const ing of ingredients) {
      if (Array.isArray(ing.allergens)) {
        for (const a of ing.allergens) {
          const trimmed = String(a).trim();
          if (trimmed) set.add(trimmed);
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [ingredients]);

  const selected = useMemo(
    () => ingredients.filter((i) => selectedIds.has(i.documentId)),
    [ingredients, selectedIds]
  );

  const excludedIngredients = useMemo(
    () => ingredients.filter((i) => excludedIngredientIds.has(i.documentId)),
    [ingredients, excludedIngredientIds]
  );

  const handleGenerate = () => {
    console.log("Generate recipes (skeleton)", {
      selectedDocumentIds: Array.from(selectedIds),
      selected,
      excludedAllergens: Array.from(excludedAllergens),
      excludedIngredientIds: Array.from(excludedIngredientIds),
      excludedIngredients,
    });
  };

  return (
    <Container>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 manrope">
            Choose Ingredients
          </h2>
          <p className="text-foreground-accent text-base">
             Pick ingredients you want to use or leave blank to generate a random recipe..
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

        {selected.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-foreground-accent mb-2">
              Generating with ({selected.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((ing) => {
                const CategoryIcon = CATEGORY_ICONS[ing.category?.trim() || "Other"] ?? TbSalad;
                return (
                  <button
                    key={ing.documentId}
                    type="button"
                    onClick={() => onToggle(ing.documentId)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary text-foreground px-4 py-2 text-sm font-medium hover:bg-primary-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <CategoryIcon className="w-4 h-4 shrink-0" aria-hidden />
                    {ing.name}
                    <HiXMark className="w-4 h-4 shrink-0" aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <section className="mb-8 space-y-4" aria-labelledby="avoid-heading">
          <div className="text-center mb-6">
            <h2 id="avoid-heading" className="text-2xl md:text-3xl font-bold text-foreground manrope mb-3">
              Anything to Avoid? (Optional)
            </h2>
            <p className="text-foreground-accent text-sm md:text-base max-w-xl mx-auto">
              For dogs with allergies or dietary restrictions.
            </p>
          </div>

          {uniqueAllergens.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground-accent mb-1.5">Exclude by allergen...</p>
              <div className="flex flex-wrap gap-2">
                {uniqueAllergens.map((allergen) => {
                  const isExcluded = excludedAllergens.has(allergen.trim());
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={(e) => {
                        onToggleAllergen(allergen);
                        (e.currentTarget as HTMLButtonElement).blur();
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isExcluded
                          ? "border-rose-500/50 bg-rose-500/20 text-foreground hover:bg-rose-500/30 focus:ring-rose-500"
                          : "border-foreground/20 bg-white/50 text-foreground hover:border-rose-500/30 hover:bg-rose-500/10 focus:ring-rose-500"
                      }`}
                    >
                      {allergen}
                      {isExcluded && <HiXMark className="w-4 h-4 shrink-0" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-foreground-accent mb-1.5">Or exclude specific ingredients</p>
            <IngredientSelector
              ingredients={ingredients}
              selectedIds={excludedIngredientIds}
              onToggle={onToggleExclude}
              loading={false}
              variant="exclude"
            />
          </div>
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

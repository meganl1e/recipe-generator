"use client";

import React, { useMemo } from "react";
import { HiCheck, HiXMark } from "react-icons/hi2";
import type { IIngredient } from "@/types";

interface IngredientSelectorProps {
  /** Ingredients list – later populate from Strapi (e.g. fetchStrapi('ingredients')) */
  ingredients: IIngredient[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  loading?: boolean;
}

export default function IngredientSelector({
  ingredients,
  selectedIds,
  onToggle,
  loading = false,
}: IngredientSelectorProps) {
  const selected = useMemo(
    () => ingredients.filter((i) => selectedIds.has(i.id)),
    [ingredients, selectedIds]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-hero-background/50 p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-foreground/10 animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground-accent mb-2">
            Selected ({selected.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((ing) => (
              <button
                key={ing.id}
                type="button"
                onClick={() => onToggle(ing.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-foreground px-4 py-2 text-sm font-medium hover:bg-primary-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {ing.name}
                <HiXMark className="w-4 h-4" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of all ingredients */}
      <div className="rounded-2xl border border-primary/30 bg-hero-background/50 p-6 md:p-8">
        <p className="text-foreground-accent text-sm mb-4">
          Optional: pick ingredients you have. Leave empty to get any recipe.
        </p>
        {ingredients.length === 0 ? (
          <p className="text-foreground-accent py-6 text-center">
            No ingredients loaded. Add ingredients in Strapi and fetch them here.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" role="list">
            {ingredients.map((ing) => {
              const isSelected = selectedIds.has(ing.id);
              return (
                <li key={ing.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(ing.id)}
                    className={`w-full flex items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      isSelected
                        ? "border-primary bg-primary/20 text-foreground"
                        : "border-transparent bg-background text-foreground hover:border-primary/50 hover:bg-primary/10"
                    }`}
                  >
                    <span className="truncate">{ing.name}</span>
                    {isSelected && <HiCheck className="w-5 h-5 shrink-0 text-primary" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

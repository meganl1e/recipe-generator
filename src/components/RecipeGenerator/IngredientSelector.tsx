"use client";

import React, { useMemo, useState } from "react";
import { HiCheck, HiXMark, HiMagnifyingGlass } from "react-icons/hi2";
import type { IIngredient } from "@/types";

/** Order categories appear on the page. Any category not listed goes at the end. */
const CATEGORY_ORDER = [
  "Protein",
  "Carbohydrates",
  "Vegetable",
  "Fats & Oils",
  "Seeds & Supplements",
  "Other",
];

interface IngredientSelectorProps {
  ingredients: IIngredient[];
  selectedIds: Set<string>;
  onToggle: (documentId: string) => void;
  loading?: boolean;
}

export default function IngredientSelector({
  ingredients,
  selectedIds,
  onToggle,
  loading = false,
}: IngredientSelectorProps) {
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => ingredients.filter((i) => selectedIds.has(i.documentId)),
    [ingredients, selectedIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, search]);

  const byCategory = useMemo(() => {
    const map = new Map<string, IIngredient[]>();
    for (const ing of filtered) {
      const cat = ing.category?.trim() || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ing);
    }
    const entries = Array.from(map.entries());
    entries.forEach(([, items]) => items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })));
    const orderIndex = (name: string) => {
      const i = CATEGORY_ORDER.indexOf(name);
      return i === -1 ? CATEGORY_ORDER.length : i;
    };
    return entries.sort(([a], [b]) => orderIndex(a) - orderIndex(b));
  }, [filtered]);

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
                key={ing.documentId}
                type="button"
                onClick={() => onToggle(ing.documentId)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-foreground px-4 py-2 text-sm font-medium hover:bg-primary-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {ing.name}
                <HiXMark className="w-4 h-4" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      {ingredients.length > 0 && (
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-accent pointer-events-none" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients..."
            aria-label="Search ingredients"
            className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-primary/30 bg-background text-foreground placeholder:text-foreground-accent focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          {search.trim() && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-foreground-accent hover:text-foreground hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Clear search"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Grid of all ingredients by category (filtered by search) */}
      {ingredients.length === 0 ? (
        <p className="text-foreground-accent py-6 text-center">
          No ingredients loaded. Add ingredients in Strapi and fetch them here.
        </p>
      ) : byCategory.length === 0 ? (
        <p className="text-foreground-accent py-6 text-center">
          No ingredients match &quot;{search.trim()}&quot;. Try a different search.
        </p>
      ) : (
        <div className="space-y-4">
          {byCategory.map(([category, items], index) => {
            const containerStyles = [
              "rounded-2xl border border-primary/40 bg-primary/15 p-4 md:p-5",
              "rounded-2xl border border-secondary/40 bg-secondary/20 p-4 md:p-5",
              "rounded-2xl border border-amber-500/30 bg-amber-500/15 p-4 md:p-5",
              "rounded-2xl border border-sky-500/30 bg-sky-500/15 p-4 md:p-5",
              "rounded-2xl border border-violet-500/30 bg-violet-500/15 p-4 md:p-5",
              "rounded-2xl border border-rose-500/30 bg-rose-500/15 p-4 md:p-5",
              "rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 md:p-5",
              "rounded-2xl border border-teal-500/30 bg-teal-500/15 p-4 md:p-5",
            ];
            const style = containerStyles[index % containerStyles.length];
            return (
              <section
                key={category}
                aria-labelledby={`category-${category.replace(/\s+/g, "-")}`}
                className={style}
              >
                <h3 id={`category-${category.replace(/\s+/g, "-")}`} className="text-sm font-semibold text-foreground mb-3">
                  {category}
                </h3>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" role="list">
                  {items.map((ing) => {
                    const isSelected = selectedIds.has(ing.documentId);
                    return (
                      <li key={ing.documentId}>
                        <button
                          type="button"
                          onClick={() => onToggle(ing.documentId)}
                          className={`w-full h-12 flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isSelected
                              ? "border-primary bg-primary/20 text-foreground"
                              : "border-transparent bg-background text-foreground hover:border-primary/50 hover:bg-primary/10"
                          }`}
                        >
                          <span className="min-w-0 wrap-break-word line-clamp-2">{ing.name}</span>
                          {isSelected && <HiCheck className="w-5 h-5 shrink-0 text-primary" aria-hidden />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

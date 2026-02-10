"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { HiCheck, HiXMark } from "react-icons/hi2";
import { TbMeat, TbWheat, TbCarrot, TbDroplet, TbSeeding, TbSalad } from "react-icons/tb";
import { SearchBar } from "@/components/ui";
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

export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Protein": TbMeat,
  "Carbohydrates": TbWheat,
  "Vegetable": TbCarrot,
  "Fats & Oils": TbDroplet,
  "Seeds & Supplements": TbSeeding,
  "Other": TbSalad,
};

const CONTAINER_STYLES = [
  "rounded-2xl border border-primary/40 bg-primary/15 p-4 md:p-5",
  "rounded-2xl border border-secondary/40 bg-secondary/20 p-4 md:p-5",
  "rounded-2xl border border-amber-500/30 bg-amber-500/15 p-4 md:p-5",
  "rounded-2xl border border-sky-500/30 bg-sky-500/15 p-4 md:p-5",
  "rounded-2xl border border-violet-500/30 bg-violet-500/15 p-4 md:p-5",
  "rounded-2xl border border-rose-500/30 bg-rose-500/15 p-4 md:p-5",
  "rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 md:p-5",
  "rounded-2xl border border-teal-500/30 bg-teal-500/15 p-4 md:p-5",
];

type CategoryColor = "primary" | "secondary" | "amber" | "sky" | "violet" | "rose" | "emerald" | "teal";
const CATEGORY_COLORS: CategoryColor[] = ["primary", "secondary", "amber", "sky", "violet", "rose", "emerald", "teal"];

const BTN = {
  unselected: {
    primary: "border-white/40 bg-white/30 text-foreground/90 hover:border-primary/50 hover:bg-primary/15 hover:text-foreground/95",
    secondary: "border-white/40 bg-white/30 text-foreground/90 hover:border-secondary/50 hover:bg-secondary/25 hover:text-foreground/95",
    amber: "border-white/40 bg-white/30 text-foreground/90 hover:border-amber-500/50 hover:bg-amber-500/20 hover:text-foreground/95",
    sky: "border-white/40 bg-white/30 text-foreground/90 hover:border-sky-500/50 hover:bg-sky-500/20 hover:text-foreground/95",
    violet: "border-white/40 bg-white/30 text-foreground/90 hover:border-violet-500/50 hover:bg-violet-500/20 hover:text-foreground/95",
    rose: "border-white/40 bg-white/30 text-foreground/90 hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-foreground/95",
    emerald: "border-white/40 bg-white/30 text-foreground/90 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-foreground/95",
    teal: "border-white/40 bg-white/30 text-foreground/90 hover:border-teal-500/50 hover:bg-teal-500/20 hover:text-foreground/95",
  },
  selected: {
    primary: "border-primary/60 bg-primary/20 text-foreground/90",
    secondary: "border-secondary/60 bg-secondary/30 text-foreground/90",
    amber: "border-amber-500/60 bg-amber-500/20 text-foreground/90",
    sky: "border-sky-500/60 bg-sky-500/20 text-foreground/90",
    violet: "border-violet-500/60 bg-violet-500/20 text-foreground/90",
    rose: "border-rose-500/60 bg-rose-500/20 text-foreground/90",
    emerald: "border-emerald-500/60 bg-emerald-500/20 text-foreground/90",
    teal: "border-teal-500/60 bg-teal-500/20 text-foreground/90",
  },
  icon: {
    primary: "text-primary",
    secondary: "text-secondary",
    amber: "text-amber-500",
    sky: "text-sky-500",
    violet: "text-violet-500",
    rose: "text-rose-500",
    emerald: "text-emerald-500",
    teal: "text-teal-500",
  },
} as const;

interface IngredientSelectorProps {
  ingredients: IIngredient[];
  selectedIds: Set<string>;
  onToggle: (documentId: string) => void;
  loading?: boolean;
  /** "exclude" = for "avoid" list: different label and chip style */
  variant?: "include" | "exclude";
}

export default function IngredientSelector({
  ingredients,
  selectedIds,
  onToggle,
  loading = false,
  variant = "include",
}: IngredientSelectorProps) {
  const [search, setSearch] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== "exclude" || !popupOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant, popupOpen]);

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
            {variant === "exclude" ? `Excluding (${selected.length})` : `Selected (${selected.length})`}
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((ing) => {
              const CategoryIcon = CATEGORY_ICONS[ing.category?.trim() || "Other"] ?? TbSalad;
              const chipClass =
                variant === "exclude"
                  ? "rounded-full border border-rose-500/50 bg-rose-500/20 text-foreground hover:bg-rose-500/30 focus:ring-rose-500"
                  : "rounded-full bg-primary text-foreground hover:bg-primary-accent focus:ring-primary";
              return (
                <button
                  key={ing.documentId}
                  type="button"
                  onClick={() => onToggle(ing.documentId)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${chipClass}`}
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

      {/* Search bar */}
      {ingredients.length > 0 && (
        <div ref={variant === "exclude" ? containerRef : undefined} className="relative">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={variant === "exclude" ? "Search to exclude ingredients..." : "Search ingredients..."}
            ariaLabel={variant === "exclude" ? "Search ingredients to exclude" : "Search ingredients"}
            onFocus={variant === "exclude" ? () => setPopupOpen(true) : undefined}
            aria-expanded={variant === "exclude" ? popupOpen : undefined}
            aria-haspopup={variant === "exclude" ? "listbox" : undefined}
          />

          {/* Exclude variant: dropdown only (no big category grid) */}
          {variant === "exclude" && popupOpen && (
            <div
              className="absolute top-full left-0 right-0 z-10 mt-1 max-h-80 overflow-auto rounded-xl border border-foreground/15 bg-background py-2 shadow-lg"
              role="listbox"
            >
              {byCategory.length === 0 ? (
                <p className="px-4 py-3 text-sm text-foreground-accent">
                  {search.trim() ? `No ingredients match "${search.trim()}".` : "Type to search ingredients."}
                </p>
              ) : (
                <div className="space-y-1">
                  {byCategory.map(([category, items], index) => {
                    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                    const CategoryIcon = CATEGORY_ICONS[category] ?? TbSalad;
                    return (
                      <div key={category}>
                        <p className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-foreground-accent">
                          <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                          {category}
                        </p>
                        <ul className="space-y-0.5" role="list">
                          {items.map((ing) => {
                            const isSelected = selectedIds.has(ing.documentId);
                            const btnClass = isSelected ? BTN.selected[color] : BTN.unselected[color];
                            return (
                              <li key={ing.documentId}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => onToggle(ing.documentId)}
                                  className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${btnClass}`}
                                >
                                  <span className="min-w-0 truncate">{ing.name}</span>
                                  {isSelected && <HiCheck className={`w-4 h-4 shrink-0 ${BTN.icon[color]}`} aria-hidden />}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Include variant: full grid with colored category containers */}
      {variant === "include" && (
        <>
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
                const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                const CategoryIcon = CATEGORY_ICONS[category] ?? TbSalad;
                return (
                  <section
                    key={category}
                    aria-labelledby={`category-${category.replace(/\s+/g, "-")}`}
                    className={CONTAINER_STYLES[index % CONTAINER_STYLES.length]}
                  >
                    <h3
                      id={`category-${category.replace(/\s+/g, "-")}`}
                      className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3"
                    >
                      <CategoryIcon className="w-6 h-6 shrink-0 text-foreground/80" aria-hidden />
                      {category}
                    </h3>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" role="list">
                      {items.map((ing) => {
                        const isSelected = selectedIds.has(ing.documentId);
                        const btnClass = isSelected ? BTN.selected[color] : BTN.unselected[color];
                        return (
                          <li key={ing.documentId}>
                            <button
                              type="button"
                              onClick={() => onToggle(ing.documentId)}
                              className={`w-full h-12 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${btnClass}`}
                            >
                              <span className="min-w-0 wrap-break-word line-clamp-2">{ing.name}</span>
                              {isSelected && <HiCheck className={`w-5 h-5 shrink-0 ${BTN.icon[color]}`} aria-hidden />}
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
        </>
      )}
    </div>
  );
}

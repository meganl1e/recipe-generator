/**
 * Recipe formulation (server-only).
 *
 * LOGIC:
 * 1. Use linear programming to solve for ingredient amounts + Grublify so the
 *    blended recipe meets or exceeds AAFCO min/max for all nutrients.
 * 2. Objective: minimize Grublify (ingredients cover most; Grublify supplements vitamins/minerals).
 * 3. Constraints: total kcal = target; each nutrient >= min and <= max (per 1000 kcal).
 * 4. Fallback: if LP is infeasible, use equal-proportions heuristic + Grublify for shortfalls.
 */

import solver from "javascript-lp-solver";
import type { IAafcoNutrient, IGrublifyPack, IIngredient, INutrientValue } from "@/types";

export interface FormulateRecipeOptions {
  dailyKcal: number;
  mealsPerDay: number;
  batchDays?: number;
}

export interface RecipeIngredient {
  documentId: string;
  name: string;
  grams: number;
}

export interface FormulateRecipeResult {
  ingredients: RecipeIngredient[];
  grublifyGrams?: number;
  totalGrams: number;
  totalKcal: number;
  perMealGrams: number;
  /** True when LP was infeasible and we fell back to the heuristic (equal proportions + Grublify for shortfalls). */
  usedFallback?: boolean;
}

/** Calories per gram for an ingredient. */
function calPerGram(ing: { calories?: number; per100g: boolean }): number {
  if (ing.calories == null) return 0;
  return ing.per100g ? ing.calories / 100 : ing.calories;
}

/** Nutrient amount per gram for an ingredient. */
function nutrientPerGram(
  ing: { nutrients: Record<string, INutrientValue>; per100g: boolean },
  key: string
): number {
  const val = ing.nutrients[key];
  if (!val) return 0;
  return ing.per100g ? val.amount / 100 : val.amount;
}

/** Find ingredient/Grublify nutrient key matching AAFCO name. */
function matchNutrientKey(aafcoName: string | null | undefined, keys: string[]): string | null {
  const str = aafcoName ?? "";
  if (!str) return null;
  const exact = keys.find((k) => k === str);
  if (exact) return exact;
  const lower = str.toLowerCase();
  return keys.find((k) => k.toLowerCase() === lower) ?? null;
}

/** Whether this AAFCO guideline is the Calcium:Phosphorus ratio (min/max are ratio values). */
function isCaPRatioGuideline(aafcoName: string | null | undefined): boolean {
  const n = (aafcoName ?? "").toLowerCase();
  return (
    (n.includes("calcium") && n.includes("phosphorus")) ||
    (n.includes("ca") && n.includes("p") && n.includes("ratio")) ||
    /ca\s*[:\-/]\s*p|phosphorus\s*[:\-/]\s*calcium/.test(n)
  );
}

/** Find keys for Calcium and Phosphorus in ingredient/Grublify nutrient keys. */
function findCaAndPKeys(keys: string[]): { caKey: string | null; pKey: string | null } {
  const caKey =
    keys.find((k) => k.toLowerCase() === "calcium") ??
    keys.find((k) => k.toLowerCase().includes("calcium")) ??
    null;
  const pKey =
    keys.find((k) => k.toLowerCase() === "phosphorus") ??
    keys.find((k) => k.toLowerCase().includes("phosphorus")) ??
    null;
  return { caKey, pKey };
}

/** Heuristic fallback when LP fails: equal proportions + Grublify for shortfalls. */
function heuristicFormulate(
  ingredients: IIngredient[],
  grublifyPack: IGrublifyPack | null,
  aafcoGuidelines: IAafcoNutrient[],
  batchKcalTarget: number
): { ingredientGrams: number[]; grublifyGrams: number; totalKcal: number } {
  const n = ingredients.length;
  const sumCalPerGram = ingredients.reduce((acc, ing) => acc + calPerGram(ing), 0);

  let ingredientGrams: number[];
  let totalKcal: number;

  if (sumCalPerGram > 0) {
    const gramsEach = batchKcalTarget / sumCalPerGram;
    ingredientGrams = ingredients.map(() => gramsEach);
    totalKcal = ingredients.reduce((acc, ing, i) => acc + calPerGram(ing) * ingredientGrams[i], 0);
    const scale = batchKcalTarget / totalKcal;
    ingredientGrams = ingredientGrams.map((g) => g * scale);
    totalKcal = batchKcalTarget;
  } else {
    ingredientGrams = ingredients.map(() => batchKcalTarget / n);
    totalKcal = batchKcalTarget;
  }

  let grublifyGrams = 0;
  if (grublifyPack && aafcoGuidelines.length > 0) {
    const allKeys = new Set<string>();
    ingredients.forEach((ing) => Object.keys(ing.nutrients).forEach((k) => allKeys.add(k)));
    Object.keys(grublifyPack.nutrients).forEach((k) => allKeys.add(k));

    for (const aafco of aafcoGuidelines) {
      if (aafco.min == null) continue;
      const key = matchNutrientKey(aafco.value ?? aafco.name, [...allKeys]);
      if (!key) continue;

      const current = ingredients.reduce(
        (acc, ing, i) => acc + nutrientPerGram(ing, key) * ingredientGrams[i],
        0
      );
      const required = aafco.min * (totalKcal / 1000);
      if (current >= required) continue;

      const shortfall = required - current;
      const gVal = grublifyPack.nutrients[key];
      if (!gVal) continue;

      const gPerGram = grublifyPack.per100g ? gVal.amount / 100 : gVal.amount;
      if (gPerGram <= 0) continue;

      const needed = shortfall / gPerGram;
      if (needed > grublifyGrams) grublifyGrams = needed;
    }
  }

  return { ingredientGrams, grublifyGrams, totalKcal };
}

export function formulateRecipe(
  aafcoGuidelines: IAafcoNutrient[],
  ingredients: IIngredient[],
  grublifyPack: IGrublifyPack | null,
  options: FormulateRecipeOptions
): FormulateRecipeResult {
  const { dailyKcal, mealsPerDay, batchDays = 7 } = options;
  const batchKcalTarget = batchDays * dailyKcal;

  if (ingredients.length === 0) {
    return {
      ingredients: [],
      totalGrams: 0,
      totalKcal: 0,
      perMealGrams: 0,
    };
  }

  // Always log nutrient name alignment (runs first so you always see it in terminal)
  const allNutrientKeysForLog = new Set<string>();
  ingredients.forEach((ing) => Object.keys(ing.nutrients).forEach((k) => allNutrientKeysForLog.add(k)));
  if (grublifyPack) Object.keys(grublifyPack.nutrients).forEach((k) => allNutrientKeysForLog.add(k));
  const ingredientKeysForLog = new Set<string>();
  ingredients.forEach((ing) => Object.keys(ing.nutrients).forEach((k) => ingredientKeysForLog.add(k)));
  const grublifyKeysForLog = grublifyPack ? Object.keys(grublifyPack.nutrients) : [];
  const matchesForLog = aafcoGuidelines.map((a) => {
    const compareStr = a.value ?? a.name;
    return { aafcoCompare: compareStr, matchedKey: matchNutrientKey(compareStr, [...allNutrientKeysForLog]) };
  });
  console.log("[recipe-formulation] Nutrient name check:", JSON.stringify({
    aafcoCompareStrings: aafcoGuidelines.map((a) => a.value ?? a.name),
    ingredientNutrientKeys: [...ingredientKeysForLog].sort(),
    grublifyNutrientKeys: grublifyKeysForLog.sort(),
    matches: matchesForLog.map((m) => (m.matchedKey ? `${m.aafcoCompare} → ${m.matchedKey}` : `${m.aafcoCompare} → NO MATCH`)),
    noMatch: matchesForLog.filter((m) => !m.matchedKey).map((m) => m.aafcoCompare),
  }, null, 2));

  const n = ingredients.length;
  const sumCalPerGram = ingredients.reduce((acc, ing) => acc + calPerGram(ing), 0);

  // If no ingredients have calories, LP is infeasible (kcal constraint would be 0 = target)
  if (sumCalPerGram <= 0) {
    const fallback = heuristicFormulate(
      ingredients,
      grublifyPack,
      aafcoGuidelines,
      batchKcalTarget
    );
    const totalGrams =
      fallback.ingredientGrams.reduce((a, b) => a + b, 0) + fallback.grublifyGrams;
    const perMealGrams =
      fallback.totalKcal > 0
        ? (dailyKcal / fallback.totalKcal) * totalGrams / mealsPerDay
        : 0;
    return {
      ingredients: ingredients.map((ing, i) => ({
        documentId: ing.documentId,
        name: ing.name,
        grams: Math.round(fallback.ingredientGrams[i] * 10) / 10,
      })),
      ...(fallback.grublifyGrams > 0 && {
        grublifyGrams: Math.round(fallback.grublifyGrams * 10) / 10,
      }),
      totalGrams: Math.round(totalGrams * 10) / 10,
      totalKcal: Math.round(fallback.totalKcal),
      perMealGrams: Math.round(perMealGrams * 10) / 10,
      usedFallback: true,
    };
  }

  const allNutrientKeys = new Set<string>();
  ingredients.forEach((ing) => Object.keys(ing.nutrients).forEach((k) => allNutrientKeys.add(k)));
  if (grublifyPack) Object.keys(grublifyPack.nutrients).forEach((k) => allNutrientKeys.add(k));

  // Build LP model: minimize Grublify, subject to kcal = target and AAFCO min/max
  const constraints: Record<string, { equal?: number; min?: number; max?: number }> = {};
  const variables: Record<string, Record<string, number>> = {};

  // kcal constraint: sum(calPerGram_i * ing_i) = batchKcalTarget (ingredients only)
  constraints.kcal = { equal: batchKcalTarget };
  for (let i = 0; i < n; i++) {
    const varName = `ing_${i}`;
    variables[varName] = { kcal: calPerGram(ingredients[i]) };
  }
  // Grublify variable (0 if no pack; solver minimizes it so ingredients do most of the work)
  variables.grublify = { kcal: 0 };
  if (!grublifyPack) {
    // No Grublify pack: all nutrient coefficients 0, so grublify stays 0
  }

  // AAFCO nutrient constraints (per 1000 kcal: amount in batch >= min * totalKcal/1000)
  for (const aafco of aafcoGuidelines) {
    // Calcium:Phosphorus ratio — linear constraints: ratio_min * sum(P) <= sum(Ca) <= ratio_max * sum(P)
    if (isCaPRatioGuideline(aafco.value ?? aafco.name) && aafco.min != null && aafco.max != null) {
      const { caKey, pKey } = findCaAndPKeys([...allNutrientKeys]);
      if (caKey && pKey) {
        const ratioMin = aafco.min;
        const ratioMax = aafco.max;
        constraints.ca_p_ratio_min = { min: 0 };
        constraints.ca_p_ratio_max = { max: 0 };
        for (let i = 0; i < n; i++) {
          const varName = `ing_${i}`;
          const ca = nutrientPerGram(ingredients[i], caKey);
          const p = nutrientPerGram(ingredients[i], pKey);
          if (!variables[varName]) variables[varName] = {};
          variables[varName].ca_p_ratio_min = ca - ratioMin * p;
          variables[varName].ca_p_ratio_max = ca - ratioMax * p;
        }
        if (variables.grublify && grublifyPack) {
          const gCa = grublifyPack.nutrients[caKey];
          const gP = grublifyPack.nutrients[pKey];
          const gCaPerGram = gCa ? (grublifyPack.per100g ? gCa.amount / 100 : gCa.amount) : 0;
          const gPPerGram = gP ? (grublifyPack.per100g ? gP.amount / 100 : gP.amount) : 0;
          variables.grublify.ca_p_ratio_min = gCaPerGram - ratioMin * gPPerGram;
          variables.grublify.ca_p_ratio_max = gCaPerGram - ratioMax * gPPerGram;
        }
      }
      continue;
    }

    const key = matchNutrientKey(aafco.value ?? aafco.name, [...allNutrientKeys]);
    if (!key) continue;

    const requiredMin = aafco.min != null ? aafco.min * (batchKcalTarget / 1000) : undefined;
    const requiredMax = aafco.max != null ? aafco.max * (batchKcalTarget / 1000) : undefined;

    if (requiredMin != null) constraints[`nut_${key}_min`] = { min: requiredMin };
    if (requiredMax != null) constraints[`nut_${key}_max`] = { max: requiredMax };

    for (let i = 0; i < n; i++) {
      const varName = `ing_${i}`;
      const coef = nutrientPerGram(ingredients[i], key);
      if (!variables[varName]) variables[varName] = {};
      if (requiredMin != null) variables[varName][`nut_${key}_min`] = coef;
      if (requiredMax != null) variables[varName][`nut_${key}_max`] = coef;
    }
    if (variables.grublify) {
      const gVal = grublifyPack?.nutrients[key];
      const gCoef = gVal
        ? (grublifyPack!.per100g ? gVal.amount / 100 : gVal.amount)
        : 0;
      if (requiredMin != null) variables.grublify[`nut_${key}_min`] = gCoef;
      if (requiredMax != null) variables.grublify[`nut_${key}_max`] = gCoef;
    }
  }

  // Ensure all variables have all constraints (solver may require it)
  const constraintNames = Object.keys(constraints);
  for (const v of Object.keys(variables)) {
    for (const c of constraintNames) {
      if (!variables[v][c]) variables[v][c] = 0;
    }
  }

  let ingredientGrams: number[];
  let grublifyGrams: number;
  let totalKcal: number;

  const model = {
    optimize: "grublify",
    opType: "min" as const,
    constraints,
    variables,
  };

  let result: { feasible?: boolean; result?: number; grublify?: number; [key: string]: unknown };
  try {
    result = solver.Solve(model) as {
      feasible?: boolean;
      result?: number;
      grublify?: number;
      [key: string]: unknown;
    };
  } catch (err) {
    console.warn("[recipe-formulation] LP solver threw:", err);
    result = { feasible: false };
  }

  if (result.feasible && result.result !== undefined) {
    ingredientGrams = [];
    for (let i = 0; i < n; i++) {
      const val = result[`ing_${i}`];
      ingredientGrams.push(typeof val === "number" && val >= 0 ? val : 0);
    }
    grublifyGrams =
      grublifyPack && typeof result.grublify === "number" && result.grublify >= 0
        ? result.grublify
        : 0;
    totalKcal = batchKcalTarget;
  } else {
    // LP infeasible — fall back to heuristic (equal proportions + Grublify for shortfalls)
    console.warn(
      "[recipe-formulation] LP infeasible (feasible:",
      result.feasible,
      "result:",
      result.result,
      ") — using heuristic"
    );
    const fallback = heuristicFormulate(
      ingredients,
      grublifyPack,
      aafcoGuidelines,
      batchKcalTarget
    );
    ingredientGrams = fallback.ingredientGrams;
    grublifyGrams = fallback.grublifyGrams;
    totalKcal = fallback.totalKcal;
  }

  const totalGrams = ingredientGrams.reduce((a, b) => a + b, 0) + grublifyGrams;
  const perMealGrams =
    totalKcal > 0 ? (dailyKcal / totalKcal) * totalGrams / mealsPerDay : 0;

  const usedFallback = !result.feasible || result.result === undefined;

  return {
    ingredients: ingredients.map((ing, i) => ({
      documentId: ing.documentId,
      name: ing.name,
      grams: Math.round(ingredientGrams[i] * 10) / 10,
    })),
    ...(grublifyGrams > 0 && { grublifyGrams: Math.round(grublifyGrams * 10) / 10 }),
    totalGrams: Math.round(totalGrams * 10) / 10,
    totalKcal: Math.round(totalKcal),
    perMealGrams: Math.round(perMealGrams * 10) / 10,
    ...(usedFallback && { usedFallback: true }),
  };
}

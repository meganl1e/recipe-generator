/**
 * Recipe formulation (server-only).
 *
 * LOGIC:
 * 1. Use linear programming to solve for ingredient amounts + Grublify so the
 *    blended recipe meets or exceeds AAFCO min/max for all nutrients.
 * 2. Objective: minimize Grublify (ingredients cover most; Grublify supplements vitamins/minerals).
 * 3. Constraints: each nutrient >= min and <= max (per 1000 kcal). No calorie target for now.
 * 4. If LP is infeasible, return an error (no fallback recipe).
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
  /** True when LP was infeasible and we fell back to the heuristic. (Unused when error is set.) */
  usedFallback?: boolean;
  /**
   * Debug view of how AAFCO guideline strings map onto ingredient / Grublify nutrient keys.
   * Used to help diagnose mismatches on the result page.
   */
  debugNutrientMapping?: {
    aafcoCompareStrings: string[];
    ingredientNutrientKeys: string[];
    grublifyNutrientKeys: string[];
    matches: Array<{ aafcoCompare: string; matchedKey: string | null }>;
    noMatch: string[];
  };
  /**
   * When true, we detected at least one AAFCO guideline that did not match any
   * ingredient/Grublify nutrient key and therefore skipped recipe formulation.
   */
  skippedDueToNutrientMismatch?: boolean;
  /** When set, the LP could not find a feasible recipe; no fallback is returned. */
  error?: string;
  /** When LP is infeasible, list of constraint violations from a test blend (for UI display). */
  lpDiagnostics?: { note?: string; violations: string[]; blockingConstraints?: string[] };
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

/** IU to grams (per 1 IU) for nutrients that use IU. Used when converting to/from mass units. */
const IU_TO_GRAMS: Record<string, number> = {
  vitaminA: 0.3e-6,       // 1 IU = 0.3 µg retinol
  vitaminD: 0.025e-6,     // 1 IU = 0.025 µg
  vitaminE: 0.67e-3,      // 1 IU = 0.67 mg d-alpha-tocopherol
  vitaminK: 0.00067e-3,   // 1 IU ≈ 0.00067 mg phylloquinone (approximate)
};

/**
 * Grams per 1 unit of the given unit. For IU, nutrientKey is required (e.g. "vitaminA").
 * Unknown units or missing IU key fall back to 1 (no conversion).
 */
function gramsPerUnit(unit: string, nutrientKey?: string): number {
  const u = (unit ?? "").trim().toLowerCase().replace(/µg|μg/, "ug");
  switch (u) {
    case "g":
      return 1;
    case "mg":
      return 0.001;
    case "ug":
    case "mcg":
      return 1e-6;
    case "iu":
    case "ui":
      return nutrientKey ? (IU_TO_GRAMS[nutrientKey] ?? 1) : 1;
    default:
      return 1;
  }
}

/**
 * Convert a nutrient amount from one unit to another.
 * Use nutrientKey when either unit is IU (e.g. "vitaminA", "vitaminD", "vitaminE").
 */
export function convertAmount(
  value: number,
  fromUnit: string,
  toUnit: string,
  nutrientKey?: string
): number {
  if (value === 0) return 0;
  const from = (fromUnit ?? "").trim().toLowerCase().replace(/µg|μg/, "ug");
  const to = (toUnit ?? "").trim().toLowerCase().replace(/µg|μg/, "ug");
  if (from === to) return value;
  const gramsPerFrom = gramsPerUnit(from, nutrientKey);
  const gramsPerTo = gramsPerUnit(to, nutrientKey);
  return (value * gramsPerFrom) / gramsPerTo;
}

/**
 * Amount of a nutrient per gram of ingredient (or per gram of Grublify), in the target unit.
 * Converts from the stored unit to targetUnit so it can be compared to AAFCO min/max.
 * @param referenceGrams - If set (e.g. Grublify pack "amount"), nutrient values are "per this many grams"; per gram = amount / referenceGrams. Otherwise per100g is used.
 */
function amountPerGramInUnit(
  nutrients: Record<string, INutrientValue>,
  per100g: boolean,
  key: string,
  targetUnit: string,
  referenceGrams?: number
): number {
  const val = nutrients[key];
  if (!val) return 0;
  const amount =
    referenceGrams != null && referenceGrams > 0
      ? val.amount / referenceGrams
      : per100g
        ? val.amount / 100
        : val.amount;
  const fromUnit = val.unit ?? "g";
  return convertAmount(amount, fromUnit, targetUnit, key);
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

/** Whether this AAFCO guideline is the Omega-6:Omega-3 ratio (min/max are ratio values). */
function isOmega6Omega3RatioGuideline(aafco: IAafcoNutrient): boolean {
  const n = (aafco.value ?? aafco.name ?? "").toLowerCase();
  const looksLikeOmegaRatio =
    n.includes("omega6toomega3") ||
    n.includes("omega6toomega3ratio") ||
    (n.includes("omega") && (n.includes("ratio") || n.includes("linoleic") || n.includes("alpha")));
  return aafco.type === "ratio" || looksLikeOmegaRatio;
}

/** Find keys for Omega-6 (numerator) and Omega-3 (denominator). Ingredients use "omega6" and "omega3". */
function findOmega6AndOmega3Keys(keys: string[]): {
  omega6Key: string | null;
  omega3Key: string | null;
} {
  const omega6Key =
    keys.find((k) => k.toLowerCase() === "omega6") ??
    keys.find((k) => k.toLowerCase().includes("omega6")) ??
    null;
  const omega3Key =
    keys.find((k) => k.toLowerCase() === "omega3") ??
    keys.find((k) => k.toLowerCase().includes("omega3")) ??
    null;
  return { omega6Key, omega3Key };
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

      const gPerGram =
        grublifyPack.amount != null && grublifyPack.amount > 0
          ? gVal.amount / grublifyPack.amount
          : grublifyPack.per100g
            ? gVal.amount / 100
            : gVal.amount;
      if (gPerGram <= 0) continue;

      const needed = shortfall / gPerGram;
      if (needed > grublifyGrams) grublifyGrams = needed;
    }

    // When using fallback, always include at least a small baseline of Grublify so the recipe
    // result lists the pack (vitamins/minerals); otherwise it would only appear when there's a shortfall.
    const FALLBACK_BASELINE_GRUBLIFY_GRAMS = 5;
    if (grublifyGrams < FALLBACK_BASELINE_GRUBLIFY_GRAMS) {
      grublifyGrams = FALLBACK_BASELINE_GRUBLIFY_GRAMS;
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
  const allKeysArr = [...allNutrientKeysForLog];
  const matchesForLog = aafcoGuidelines.map((a) => {
    const compareStr = a.value ?? a.name;
    const singleKey = matchNutrientKey(compareStr, allKeysArr);
    if (singleKey) return { aafcoCompare: compareStr, matchedKey: singleKey };
    if (isCaPRatioGuideline(compareStr) && a.min != null && a.max != null) {
      const { caKey, pKey } = findCaAndPKeys(allKeysArr);
      if (caKey && pKey) return { aafcoCompare: compareStr, matchedKey: "(Ca:P ratio)" };
    }
    if (isOmega6Omega3RatioGuideline(a) && a.min != null && a.max != null) {
      const { omega6Key, omega3Key } = findOmega6AndOmega3Keys(allKeysArr);
      if (omega6Key && omega3Key)
        return { aafcoCompare: compareStr, matchedKey: "(Omega-6:Omega-3 ratio)" };
    }
    return { aafcoCompare: compareStr, matchedKey: null };
  });
  const noMatch = matchesForLog.filter((m) => !m.matchedKey).map((m) => m.aafcoCompare);
  const debugNutrientMapping = {
    aafcoCompareStrings: aafcoGuidelines.map((a) => a.value ?? a.name),
    ingredientNutrientKeys: [...ingredientKeysForLog].sort(),
    grublifyNutrientKeys: grublifyKeysForLog.sort(),
    matches: matchesForLog,
    noMatch,
  };
  console.log("[recipe-formulation] Nutrient name check:", JSON.stringify({
    aafcoCompareStrings: debugNutrientMapping.aafcoCompareStrings,
    ingredientNutrientKeys: debugNutrientMapping.ingredientNutrientKeys,
    grublifyNutrientKeys: debugNutrientMapping.grublifyNutrientKeys,
    matches: debugNutrientMapping.matches.map((m) =>
      m.matchedKey ? `${m.aafcoCompare} → ${m.matchedKey}` : `${m.aafcoCompare} → NO MATCH`
    ),
    noMatch: debugNutrientMapping.noMatch,
  }, null, 2));

  // If any AAFCO guideline failed to match an ingredient/Grublify nutrient key,
  // skip formulation and return the mapping so the UI can display it.
  if (debugNutrientMapping.noMatch.length > 0) {
    return {
      ingredients: [],
      totalGrams: 0,
      totalKcal: 0,
      perMealGrams: 0,
      debugNutrientMapping,
      skippedDueToNutrientMismatch: true,
    };
  }

  const n = ingredients.length;
  const sumCalPerGram = ingredients.reduce((acc, ing) => acc + calPerGram(ing), 0);

  // If no ingredients have calories, we'd get a recipe with 0 kcal (not useful)
  if (sumCalPerGram <= 0) {
    return {
      ingredients: [],
      totalGrams: 0,
      totalKcal: 0,
      perMealGrams: 0,
      error: "No ingredients have calories.",
    };
  }

  const allNutrientKeys = new Set<string>();
  ingredients.forEach((ing) => Object.keys(ing.nutrients).forEach((k) => allNutrientKeys.add(k)));
  if (grublifyPack) Object.keys(grublifyPack.nutrients).forEach((k) => allNutrientKeys.add(k));

  // Build LP model: minimize Grublify, subject to AAFCO min/max only (no calorie constraint for now)
  const constraints: Record<string, { equal?: number; min?: number; max?: number }> = {};
  const variables: Record<string, Record<string, number>> = {};
  /** For diagnostics: original AAFCO values (per 1000 kcal) and unit so violations show readable info. */
  const constraintMeta: Record<
    string,
    { originalMin?: number; originalMax?: number; unit: string; ratioNumKey?: string; ratioDenomKey?: string }
  > = {};

  for (let i = 0; i < n; i++) {
    variables[`ing_${i}`] = {};
  }
  variables.grublify = {};

  if (grublifyPack) {
    // Use Grublify in every recipe: enforce a minimum amount per batch
    const MIN_GRUBLIFY_GRAMS = 5;
    constraints.grublify_min = { min: MIN_GRUBLIFY_GRAMS };
    variables.grublify.grublify_min = 1;
    for (let i = 0; i < n; i++) {
      variables[`ing_${i}`].grublify_min = 0;
    }
    constraintMeta.grublify_min = { originalMin: MIN_GRUBLIFY_GRAMS, unit: "g" };
  } else {
    // No Grublify pack: all nutrient coefficients 0, so grublify stays 0
  }

  // AAFCO nutrient constraints (per 1000 kcal: amount in batch >= min * totalKcal/1000)
  for (const aafco of aafcoGuidelines) {
    // Calcium:Phosphorus ratio — we need  ratio_min <= total(Ca)/total(P) <= ratio_max.
    // Rewrite as linear constraints: total(Ca) - ratio_min*total(P) >= 0  and  total(Ca) - ratio_max*total(P) <= 0.
    // So we use LHS = Ca - ratio*P per gram; the solver sees sum(LHS*grams) >= 0 (min) or <= 0 (max).
    if (isCaPRatioGuideline(aafco.value ?? aafco.name) && aafco.min != null && aafco.max != null) {
      const { caKey, pKey } = findCaAndPKeys([...allNutrientKeys]);
      if (caKey && pKey) {
        const ratioMin = aafco.min;
        const ratioMax = aafco.max;
        constraints.ca_p_ratio_min = { min: 0 };
        constraints.ca_p_ratio_max = { max: 0 };
        constraintMeta.ca_p_ratio_min = { originalMin: ratioMin, unit: "ratio (Ca:P)", ratioNumKey: caKey, ratioDenomKey: pKey };
        constraintMeta.ca_p_ratio_max = { originalMax: ratioMax, unit: "ratio (Ca:P)", ratioNumKey: caKey, ratioDenomKey: pKey };
        for (let i = 0; i < n; i++) {
          const varName = `ing_${i}`;
          const ca = amountPerGramInUnit(ingredients[i].nutrients, ingredients[i].per100g, caKey, "g");
          const p = amountPerGramInUnit(ingredients[i].nutrients, ingredients[i].per100g, pKey, "g");
          if (!variables[varName]) variables[varName] = {};
          variables[varName].ca_p_ratio_min = ca - ratioMin * p;
          variables[varName].ca_p_ratio_max = ca - ratioMax * p;
        }
        if (variables.grublify && grublifyPack) {
          const gCaPerGram = amountPerGramInUnit(grublifyPack.nutrients, grublifyPack.per100g, caKey, "g", grublifyPack.amount);
          const gPPerGram = amountPerGramInUnit(grublifyPack.nutrients, grublifyPack.per100g, pKey, "g", grublifyPack.amount);
          variables.grublify.ca_p_ratio_min = gCaPerGram - ratioMin * gPPerGram;
          variables.grublify.ca_p_ratio_max = gCaPerGram - ratioMax * gPPerGram;
        }
      }
      continue;
    }

    // Omega-6:Omega-3 ratio — linear constraints: ratio_min * sum(omega3) <= sum(omega6) <= ratio_max * sum(omega3)
    if (
      isOmega6Omega3RatioGuideline(aafco) &&
      aafco.min != null &&
      aafco.max != null
    ) {
      const { omega6Key, omega3Key } = findOmega6AndOmega3Keys([...allNutrientKeys]);
      if (omega6Key && omega3Key) {
        const ratioMin = aafco.min;
        const ratioMax = aafco.max;
        constraints.omega6_omega3_ratio_min = { min: 0 };
        constraints.omega6_omega3_ratio_max = { max: 0 };
        constraintMeta.omega6_omega3_ratio_min = { originalMin: ratioMin, unit: "ratio (ω6:ω3)", ratioNumKey: omega6Key, ratioDenomKey: omega3Key };
        constraintMeta.omega6_omega3_ratio_max = { originalMax: ratioMax, unit: "ratio (ω6:ω3)", ratioNumKey: omega6Key, ratioDenomKey: omega3Key };
        for (let i = 0; i < n; i++) {
          const varName = `ing_${i}`;
          const o6 = amountPerGramInUnit(ingredients[i].nutrients, ingredients[i].per100g, omega6Key, "g");
          const o3 = amountPerGramInUnit(ingredients[i].nutrients, ingredients[i].per100g, omega3Key, "g");
          if (!variables[varName]) variables[varName] = {};
          variables[varName].omega6_omega3_ratio_min = o6 - ratioMin * o3;
          variables[varName].omega6_omega3_ratio_max = o6 - ratioMax * o3;
        }
        if (variables.grublify && grublifyPack) {
          const gO6PerGram = amountPerGramInUnit(grublifyPack.nutrients, grublifyPack.per100g, omega6Key, "g", grublifyPack.amount);
          const gO3PerGram = amountPerGramInUnit(grublifyPack.nutrients, grublifyPack.per100g, omega3Key, "g", grublifyPack.amount);
          variables.grublify.omega6_omega3_ratio_min = gO6PerGram - ratioMin * gO3PerGram;
          variables.grublify.omega6_omega3_ratio_max = gO6PerGram - ratioMax * gO3PerGram;
        }
      }
      continue;
    }

    const key = matchNutrientKey(aafco.value ?? aafco.name, [...allNutrientKeys]);
    if (!key) continue;

    // Don't treat ratio keys as absolute nutrients (e.g. omega6ToOmega3Ratio is a ratio, not g/mg)
    if (key.toLowerCase().includes("omega6toomega3") || key.toLowerCase().includes("omega6toomega3ratio")) continue;

    const aafcoUnit = (aafco.unit ?? "g").trim() || "g";
    const requiredMin = aafco.min != null ? aafco.min * (batchKcalTarget / 1000) : undefined;
    const requiredMax = aafco.max != null ? aafco.max * (batchKcalTarget / 1000) : undefined;

    if (requiredMin != null) {
      constraints[`nut_${key}_min`] = { min: requiredMin };
      constraintMeta[`nut_${key}_min`] = { originalMin: aafco.min ?? undefined, unit: aafcoUnit };
    }
    if (requiredMax != null) {
      constraints[`nut_${key}_max`] = { max: requiredMax };
      constraintMeta[`nut_${key}_max`] = { originalMax: aafco.max ?? undefined, unit: aafcoUnit };
    }

    for (let i = 0; i < n; i++) {
      const varName = `ing_${i}`;
      const coef = amountPerGramInUnit(ingredients[i].nutrients, ingredients[i].per100g, key, aafcoUnit);
      if (!variables[varName]) variables[varName] = {};
      if (requiredMin != null) variables[varName][`nut_${key}_min`] = coef;
      if (requiredMax != null) variables[varName][`nut_${key}_max`] = coef;
    }
    if (variables.grublify && grublifyPack) {
      const gCoef = amountPerGramInUnit(grublifyPack.nutrients, grublifyPack.per100g, key, aafcoUnit, grublifyPack.amount);
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
    totalKcal = ingredients.reduce(
      (sum, ing, i) => sum + calPerGram(ing) * ingredientGrams[i],
      0
    );
  } else {
    // LP infeasible — return error and log which constraints a test blend violates
    console.warn("[recipe-formulation] LP could not find a feasible recipe. Solver result:", result);
    console.warn("  Model: batchKcalTarget =", batchKcalTarget, "| ingredients =", n, "| constraints =", Object.keys(constraints).length);

    const violations: string[] = [];
    const violatedConstraintNames: string[] = [];
    let blockingConstraints: string[] = [];
    const sumCalPerGramDiag = ingredients.reduce((acc, ing) => acc + calPerGram(ing), 0);
    if (sumCalPerGramDiag > 0) {
      const gramsEach = batchKcalTarget / sumCalPerGramDiag;
      const testGrams = ingredients.map(() => gramsEach);
      const testGrublify = grublifyPack ? 50 : 0;
      // Convert batch amounts to per-1000-kcal for display (match AAFCO scale); skip for ratio constraints
      const toPer1000Kcal = (batchAmount: number) =>
        batchKcalTarget > 0 ? (batchAmount * 1000) / batchKcalTarget : batchAmount;
      const isRatioConstraint = (name: string) =>
        name.startsWith("ca_p_ratio_") || name.startsWith("omega6_omega3_ratio_");
      // Total grams of a nutrient in the test blend (for displaying actual ratio = num/denom)
      const testBlendTotalFor = (key: string): number => {
        let total = 0;
        for (let i = 0; i < ingredients.length; i++) {
          total += amountPerGramInUnit(ingredients[i].nutrients, ingredients[i].per100g, key, "g") * testGrams[i];
        }
        if (grublifyPack) {
          total += amountPerGramInUnit(grublifyPack.nutrients, grublifyPack.per100g, key, "g", grublifyPack.amount) * testGrublify;
        }
        return total;
      };

      for (const cName of Object.keys(constraints)) {
        const c = constraints[cName];
        const meta = constraintMeta[cName];
        const unit = meta?.unit ?? "";
        const unitLabel = unit ? ` ${unit}` : "";
        const lhs = Object.keys(variables).reduce((sum, vName) => {
          const coef = variables[vName][cName] ?? 0;
          const val = vName.startsWith("ing_")
            ? testGrams[Number(vName.replace("ing_", ""))] ?? 0
            : vName === "grublify"
              ? testGrublify
              : 0;
          return sum + coef * val;
        }, 0);
        const usePer1000 = !isRatioConstraint(cName);
        // For ratio constraints, show actual ratio (num/denom) instead of raw LHS
        let lhsDisplay: number;
        let ratioSuffix = unitLabel;
        if (isRatioConstraint(cName) && meta?.ratioNumKey && meta?.ratioDenomKey) {
          const totalNum = testBlendTotalFor(meta.ratioNumKey);
          const totalDenom = testBlendTotalFor(meta.ratioDenomKey);
          lhsDisplay = totalDenom > 0 ? totalNum / totalDenom : 0;
          ratioSuffix = unitLabel;
        } else {
          lhsDisplay = usePer1000 ? toPer1000Kcal(lhs) : lhs;
          ratioSuffix = usePer1000 ? `${unitLabel}/1000 kcal` : unitLabel;
        }
        const suffix = usePer1000 ? `${unitLabel}/1000 kcal` : unitLabel;

        const blendLabel = isRatioConstraint(cName) ? "test blend ratio" : "test blend";
        if (c.equal != null && Math.abs(lhs - c.equal) > 0.01) {
          violatedConstraintNames.push(cName);
          const eqDisplay = usePer1000 ? toPer1000Kcal(c.equal) : c.equal;
          violations.push(`${cName}: required = ${eqDisplay.toFixed(3)}${suffix}, ${blendLabel} = ${lhsDisplay.toFixed(3)}${ratioSuffix}`);
        }
        if (c.min != null && lhs < c.min - 0.01) {
          violatedConstraintNames.push(cName);
          const minVal = usePer1000
            ? (meta?.originalMin ?? toPer1000Kcal(c.min))
            : (meta?.originalMin ?? c.min);
          violations.push(`${cName} (${unit || "—"}): min = ${minVal.toFixed(3)}${suffix}, ${blendLabel} = ${lhsDisplay.toFixed(3)}${ratioSuffix} (SHORT)`);
        }
        if (c.max != null && lhs > c.max + 0.01) {
          violatedConstraintNames.push(cName);
          const maxVal = usePer1000
            ? (meta?.originalMax ?? toPer1000Kcal(c.max))
            : (meta?.originalMax ?? c.max);
          violations.push(`${cName} (${unit || "—"}): max = ${maxVal.toFixed(3)}${suffix}, ${blendLabel} = ${lhsDisplay.toFixed(3)}${ratioSuffix} (OVER)`);
        }
      }

      // Find which constraints are "blocking": if we remove one, does the LP become feasible?
      const uniqueViolated = [...new Set(violatedConstraintNames)];
      for (const drop of uniqueViolated) {
        const relaxedConstraints = { ...constraints };
        delete relaxedConstraints[drop];
        const relaxedVariables: Record<string, Record<string, number>> = {};
        for (const vName of Object.keys(variables)) {
          relaxedVariables[vName] = { ...variables[vName] };
          delete relaxedVariables[vName][drop];
        }
        try {
          const relaxedResult = solver.Solve({
            optimize: "grublify",
            opType: "min" as const,
            constraints: relaxedConstraints,
            variables: relaxedVariables,
          }) as { feasible?: boolean };
          if (relaxedResult.feasible) blockingConstraints.push(drop);
        } catch {
          // ignore solver errors when probing
        }
      }

      if (violations.length > 0) {
        console.warn("  Diagnostic (test blend: equal ingredient weights + 50g Grublify) — violated constraints:");
        violations.forEach((v) => console.warn("    ", v));
        if (blockingConstraints.length > 0) {
          console.warn("  Blocking (removing one of these makes a solution possible):", blockingConstraints);
        }
      }
    }

    return {
      ingredients: [],
      totalGrams: 0,
      totalKcal: 0,
      perMealGrams: 0,
      error:
        "Recipe solver could not find a feasible recipe. Minimums are “at least” (can be greater); the solver could not find any blend of ingredients + Grublify that meets every constraint. Check that the Grublify pack has all required nutrients and the correct reference amount (e.g. per 10 g).",
      ...(violations.length > 0 && {
        lpDiagnostics: {
          note: "List below shows a simple test blend; the solver tried but could not find any blend satisfying all constraints.",
          violations,
          ...(blockingConstraints.length > 0 && { blockingConstraints }),
        },
      }),
    };
  }

  const totalGrams = ingredientGrams.reduce((a, b) => a + b, 0) + grublifyGrams;
  const perMealGrams =
    totalKcal > 0 ? (dailyKcal / totalKcal) * totalGrams / mealsPerDay : 0;

  return {
    ingredients: ingredients.map((ing, i) => ({
      documentId: ing.documentId,
      name: ing.name,
      grams: Math.round(ingredientGrams[i] * 10) / 10,
    })),
    ...(grublifyPack != null && { grublifyGrams: Math.round(grublifyGrams * 10) / 10 }),
    totalGrams: Math.round(totalGrams * 10) / 10,
    totalKcal: Math.round(totalKcal),
    perMealGrams: Math.round(perMealGrams * 10) / 10,
  };
}

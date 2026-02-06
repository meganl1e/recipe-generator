/**
 * Dog daily calorie calculation (for homemade food portions)
 *
 * LOGIC:
 * 1. RER = Resting Energy Requirement (calories if the dog did nothing all day)
 *    Formula: 70 × (body weight in kg)^0.75
 *    We need weight in kg; if user enters lbs, convert: kg = lbs / 2.205
 *
 * 2. MER = Maintenance Energy Requirement (real-world daily calories)
 *    Formula: RER × life-stage factor
 *    Factors (typical values):
 *    - Neutered adult: 1.6
 *    - Intact adult: 1.8
 *    - Weight loss: 1.0
 *    - Weight gain: 1.7
 *    - Very active / working: 2.0–3.0
 *    - Puppy (growing): 2.0–3.0 (higher when younger)
 *    - Senior, less active: 1.2–1.4
 *
 * 3. Result = MER = calories per day. Use this to decide how much food per day,
 *    then divide by number of meals for portion size.
 */

export const LB_TO_KG = 2.205;

/**
 * Convert pounds to kilograms.
 */
export function lbsToKg(lbs: number): number {
  return lbs / LB_TO_KG;
}

/**
 * RER (Resting Energy Requirement) in kcal/day.
 * @param weightKg - body weight in kilograms
 */
export function rer(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

/**
 * MER (Maintenance Energy Requirement) in kcal/day.
 * @param weightKg - body weight in kilograms
 * @param factor - life stage / activity factor (e.g. 1.6 for neutered adult)
 */
export function mer(weightKg: number, factor: number): number {
  return Math.round(rer(weightKg) * factor);
}

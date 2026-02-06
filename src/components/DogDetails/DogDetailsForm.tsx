"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi2";
import { lbsToKg, mer } from "@/lib/dog-calories";

// Life stage factors mapping
const LIFE_STAGE_FACTORS: Record<string, number> = {
  "neutered-adult": 1.6,
  "intact-adult": 1.8,
  "puppy": 3.0,
  "adolescent": 2.0,
};

const LIFE_STAGE_OPTIONS = [
  { value: "neutered-adult", label: "Neutered Adult" },
  { value: "intact-adult", label: "Intact Adult" },
  { value: "puppy", label: "Puppy (0-4 months)" },
  { value: "adolescent", label: "Adolescent (4-12 months)" },
] as const;

export default function DogDetailsForm() {
  const [name, setName] = useState<string>("");
  const [weight, setWeight] = useState<number>(0);
  const [unit, setUnit] = useState<string>("lbs");
  const [lifeStage, setLifeStage] = useState<string>("");
  const [lifeStageOpen, setLifeStageOpen] = useState(false);
  const lifeStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (lifeStageRef.current && !lifeStageRef.current.contains(event.target as Node)) {
        setLifeStageOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate calories when inputs change
  const dailyCalories = useMemo(() => {
    if (!weight || weight <= 0) return null;

    const weightKg = unit === "lbs" ? lbsToKg(weight) : weight;
    const factor = LIFE_STAGE_FACTORS[lifeStage] || 1.6;
    return mer(weightKg, factor);
  }, [weight, unit, lifeStage]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <form className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-5 items-center">
        {/* Name Input */}
        <label
          htmlFor="name"
          className="text-xl font-medium text-foreground"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full min-w-0 px-2 py-3 border-0 border-b-4 border-primary bg-transparent text-foreground placeholder:text-foreground-accent/50 focus:outline-none transition-colors font-medium"
        />

        {/* Weight Input */}
        <label
          htmlFor="weight"
          className="text-xl font-medium text-foreground"
        >
          Weight
        </label>
        <div className="flex items-end gap-3 min-w-0">
          <input
            id="weight"
            type="number"
            min="0"
            step="0.1"
            // placeholder="Weight"
            value={weight || ""}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="flex-1 min-w-0 px-2 py-3 border-0 border-b-4 border-primary bg-transparent text-foreground placeholder:text-foreground-accent/50 focus:outline-none transition-colors font-medium"
          />
          <div className="relative shrink-0">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full min-w-18 pl-2 pr-8 py-3 border-0 border-b-4 border-primary bg-transparent text-foreground focus:outline-none transition-colors cursor-pointer font-medium appearance-none"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
            <HiChevronDown className="absolute right-0 bottom-3 w-5 h-5 text-foreground-accent pointer-events-none" />
          </div>
        </div>

        {/* Life Stage – custom dropdown so placeholder is grey, options are black */}
        <label
          htmlFor="life-stage"
          className="text-xl font-medium text-foreground"
        >
          Life Stage
        </label>
        <div className="relative min-w-0" ref={lifeStageRef}>
          <button
            type="button"
            id="life-stage"
            onClick={() => setLifeStageOpen((open) => !open)}
            className={`w-full min-w-0 pl-2 pr-8 py-3 border-0 border-b-4 border-primary bg-transparent text-left focus:outline-none transition-colors cursor-pointer font-medium relative ${lifeStage === "" ? "text-gray-400" : "text-foreground"}`}
          >
            {lifeStage === "" ? "Select life stage" : LIFE_STAGE_OPTIONS.find((o) => o.value === lifeStage)?.label ?? lifeStage}
            <HiChevronDown className="absolute right-0 bottom-3 w-5 h-5 text-foreground-accent pointer-events-none" />
          </button>
          {lifeStageOpen && (
            <ul className="absolute left-0 right-0 top-full mt-0 z-10 bg-background border border-black/10 rounded-lg shadow-lg py-1 max-h-60 overflow-auto">
              {LIFE_STAGE_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      setLifeStage(option.value);
                      setLifeStageOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-foreground hover:bg-black/5 font-medium"
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      {/* Result Display */}
      {dailyCalories && (
        <div className="mt-10 text-center">
          {name ? (
            <p className="text-2xl font-semibold text-foreground mb-3">
              {name} needs
            </p>
          ) : (
            <p className="text-2xl font-semibold text-foreground mb-3">
              Your dog needs
            </p>
          )}
          
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold text-primary">
              {dailyCalories.toLocaleString()}
            </span>
            <span className="text-xl text-foreground-accent">
              kcal/day
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import type { IIngredient } from "@/types";
import DogDetailsForm, { type DogDetailsValue } from "@/components/DogDetails/DogDetailsForm";
import RecipeGeneratorClient from "@/components/RecipeGenerator/RecipeGeneratorClient";

const INITIAL_DOG_DETAILS: DogDetailsValue = {
  name: "",
  weight: 0,
  unit: "lbs",
  lifeStage: "",
};

interface GeneratorTabsProps {
  ingredients: IIngredient[];
}

export default function GeneratorTabs({ ingredients }: GeneratorTabsProps) {
  const [dogDetails, setDogDetails] = useState<DogDetailsValue>(INITIAL_DOG_DETAILS);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Intro at top */}
      <header className="text-center mb-12 px-1 md:px-2">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground manrope mb-3">
          Recipe Generator
        </h1>
        <p className="text-foreground-accent text-base max-w-xl mx-auto">
          Add your dog&apos;s details, then pick ingredients you have. We&apos;ll suggest balanced recipes tailored to their needs.
        </p>
      </header>

      {/* Dog details block (first) - always full form, calories show inline when valid */}
      <section aria-label="Dog details" className="px-1 md:px-2 mb-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground manrope mb-3">
            About Your Dog
          </h2>
          <p className="text-foreground-accent text-sm md:text-base max-w-xl mx-auto">
            This is used to calculate portion sizes.
          </p>
        </div>

        <DogDetailsForm value={dogDetails} onChange={setDogDetails} />
      </section>

      {/* Ingredients block (below) */}
      <section aria-label="Ingredients" className="px-1 md:px-2">
        <RecipeGeneratorClient ingredients={ingredients} />
      </section>
    </div>
  );
}

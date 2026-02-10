"use client";

import { useState } from "react";
import type { IIngredient } from "@/types";
import DogDetailsForm from "@/components/DogDetails/DogDetailsForm";
import RecipeGeneratorClient from "@/components/RecipeGenerator/RecipeGeneratorClient";

type TabKey = "dog-details" | "ingredients";

interface GeneratorTabsProps {
  ingredients: IIngredient[];
}

export default function GeneratorTabs({ ingredients }: GeneratorTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dog-details");

  const tabs: { id: TabKey; label: string }[] = [
    { id: "dog-details", label: "Dog details" },
    { id: "ingredients", label: "Ingredients" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Top tab switcher */}
      <div className="flex justify-center mb-10">
        <div
          role="tablist"
          aria-label="Recipe setup"
          className="inline-flex rounded-full bg-black/5 p-1"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`px-6 py-2.5 text-sm md:text-base font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-primary text-foreground shadow-sm"
                    : "text-foreground-accent hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels */}
      <div className="mt-2">
        {activeTab === "dog-details" ? (
          <section
            aria-label="Dog details"
            className="px-1 md:px-2"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground manrope mb-3">
                Dog details
              </h1>
              <p className="text-foreground-accent text-sm md:text-base max-w-xl mx-auto">
                Enter your dog&apos;s details to estimate their daily calorie
                needs before creating recipes.
              </p>
            </div>
            <DogDetailsForm />
          </section>
        ) : (
          <section
            aria-label="Ingredients"
            className="px-1 md:px-2"
          >
            <RecipeGeneratorClient ingredients={ingredients} />
          </section>
        )}
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const RECIPE_RESULT_KEY = "recipe-result";

export default function GeneratorResultPage() {
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(RECIPE_RESULT_KEY);
    setRawJson(raw);
    if (raw) {
      try {
        setData(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        setData(null);
      }
    } else {
      setData(null);
    }
  }, []);

  if (rawJson === null) {
    return (
      <div className="min-h-screen bg-background py-12 px-5 flex items-center justify-center">
        <p className="text-foreground-accent">Loading…</p>
      </div>
    );
  }

  if (!rawJson) {
    return (
      <div className="min-h-screen bg-background py-12 px-5 flex flex-col items-center justify-center gap-4">
        <p className="text-foreground-accent">No recipe generated yet.</p>
        <Link
          href="/generator"
          className="text-primary font-semibold hover:underline"
        >
          Go to Generator
        </Link>
      </div>
    );
  }

  const debug = data?.debugNutrientMapping as
    | {
        aafcoCompareStrings: string[];
        ingredientNutrientKeys: string[];
        grublifyNutrientKeys: string[];
        matches: Array<{ aafcoCompare: string; matchedKey: string | null }>;
        noMatch: string[];
      }
    | undefined;
  const skipped = Boolean(data?.skippedDueToNutrientMismatch);

  return (
    <div className="min-h-screen bg-background py-12 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {skipped ? "Nutrient Name Mapping" : "Recipe Result"}
          </h1>
          <Link
            href="/generator"
            className="text-primary font-medium hover:underline"
          >
            ← Back to Generator
          </Link>
        </div>

        {skipped && debug && (
          <div className="mb-8 space-y-4">
            <p className="text-sm text-foreground-accent">
              We found AAFCO nutrients that did not match any ingredient/Grublify nutrient keys.
              Fix the names in Strapi so they line up before generating recipes.
            </p>

            <div className="overflow-auto border border-foreground/10 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-foreground/5 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-foreground">AAFCO compare string</th>
                    <th className="px-3 py-2 font-semibold text-foreground">Matched nutrient key</th>
                  </tr>
                </thead>
                <tbody>
                  {debug.matches.map((m) => {
                    const isNoMatch = !m.matchedKey;
                    return (
                      <tr
                        key={m.aafcoCompare}
                        className={isNoMatch ? "bg-rose-500/5" : "bg-background"}
                      >
                        <td className="px-3 py-2 text-foreground font-mono">{m.aafcoCompare}</td>
                        <td className="px-3 py-2 text-foreground font-mono">
                          {isNoMatch ? (
                            <span className="text-rose-600 font-semibold">NO MATCH</span>
                          ) : (
                            m.matchedKey
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-foreground-accent">
              <div>
                <h2 className="font-semibold text-foreground mb-1">All AAFCO compare strings</h2>
                <pre className="bg-foreground/5 rounded-md p-2 whitespace-pre-wrap wrap-break-word">
                  {debug.aafcoCompareStrings.join("\n")}
                </pre>
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-1">All nutrient keys</h2>
                <pre className="bg-foreground/5 rounded-md p-2 whitespace-pre-wrap wrap-break-word">
                  {[
                    "Ingredients:",
                    ...debug.ingredientNutrientKeys,
                    "",
                    "Grublify pack:",
                    ...debug.grublifyNutrientKeys,
                  ].join("\n")}
                </pre>
              </div>
            </div>
          </div>
        )}

        <pre className="bg-foreground/5 border border-foreground/10 rounded-lg p-6 overflow-auto text-sm text-foreground font-mono whitespace-pre-wrap wrap-break-word">
          {rawJson}
        </pre>
      </div>
    </div>
  );
}

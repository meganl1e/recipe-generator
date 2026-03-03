"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const RECIPE_RESULT_KEY = "recipe-result";

export default function GeneratorResultPage() {
  const [json, setJson] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(RECIPE_RESULT_KEY);
    setJson(raw);
  }, []);

  if (json === null) {
    return (
      <div className="min-h-screen bg-background py-12 px-5 flex items-center justify-center">
        <p className="text-foreground-accent">Loading…</p>
      </div>
    );
  }

  if (!json) {
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

  return (
    <div className="min-h-screen bg-background py-12 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Recipe Result</h1>
          <Link
            href="/generator"
            className="text-primary font-medium hover:underline"
          >
            ← Back to Generator
          </Link>
        </div>
        <pre className="bg-foreground/5 border border-foreground/10 rounded-lg p-6 overflow-auto text-sm text-foreground font-mono whitespace-pre-wrap wrap-break-word">
          {json}
        </pre>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import type { IIngredient } from "@/types";
import { getIngredients } from "@/lib/strapi";
import { siteDetails } from "@/data/site-details";
import GeneratorTabs from "@/components/RecipeGenerator/GeneratorTabs";

const { generator, siteUrl } = siteDetails;

export const metadata: Metadata = {
  title: generator.title,
  description: generator.description,
  openGraph: {
    title: generator.title,
    description: generator.description,
    url: `${siteUrl}generator`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: generator.title,
    description: generator.description,
  },
  alternates: {
    canonical: `${siteUrl}generator`,
  },
};

export default async function GeneratorPage() {
  const ingredients = await getIngredients();

  return (
    <div className="min-h-screen bg-background py-12 px-5">
      <GeneratorTabs ingredients={ingredients} />
    </div>
  );
}

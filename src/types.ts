/** One AAFCO nutrient guideline (min/max per nutrient name). The single type in Strapi returns an array of these. */
export interface IAafcoNutrient {
  id: number;
  name: string;
  min: number | null;
  max: number | null;
  unit: string;
  notes: string | null;
}

export interface IMenuItem {
    text: string;
    url: string;
}

export interface INutrientValue {
    unit: string;
    amount: number;
}

export interface IIngredient {
    id: number;
    documentId: string;
    name: string;
    description: string;
    usdaFdcId: number;
    nutrients: Record<string, INutrientValue>;
    allergens: string[];
    per100g: boolean;
    category: string;
    yield: number;
}

export interface IBenefit {
    title: string;
    description: string;
    imageSrc: string;
    bullets: IBenefitBullet[]
}

export interface IBenefitBullet {
    title: string;
    description: string;
    icon: React.ReactNode;
}

export interface IPricing {
    name: string;
    price: number | string;
    features: string[];
}

export interface IFAQ {
    question: string;
    answer: string;
}

export interface ITestimonial {
    name: string;
    role: string;
    message: string;
    avatar: string;
}

export interface IStats {
    title: string;
    icon: React.ReactNode;
    description: string;
}

export interface ISocials {
    facebook?: string;
    github?: string;
    instagram?: string;
    linkedin?: string;
    threads?: string;
    twitter?: string;
    youtube?: string;
    x?: string;
    [key: string]: string | undefined;
}

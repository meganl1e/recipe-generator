export interface IMenuItem {
    text: string;
    url: string;
}

/** One nutrient value from Strapi JSON (e.g. iron, zinc, lysine). */
export interface INutrientValue {
    unit: string;
    amount: number;
}

/** Strapi ingredient – matches your API response (flat, no attributes wrapper). */
export interface IIngredient {
    id: number;
    documentId: string;
    name: string;
    description?: string;
    usdaFdcId?: number;
    /** JSON of nutrient name → { unit, amount }. Not every nutrient required. */
    nutrients?: Record<string, INutrientValue>;
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

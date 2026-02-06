import { IPricing } from "@/types";

export const tiers: IPricing[] = [
    {
        name: 'Starter',
        price: 0,
        features: [
            'Up to 10 recipe generations per month',
            'Basic ingredient suggestions',
            'Email support',
        ],
    },
    {
        name: 'Pro',
        price: 9,
        features: [
            'Unlimited recipe generations',
            'Meal planning & grocery lists',
            'Dietary filters (vegan, keto, etc.)',
            'Priority support',
            'Save & organize recipes',
        ],
    },
    {
        name: 'Family',
        price: 'Custom',
        features: [
            'Everything in Pro',
            'Multiple household members',
            'Custom meal plans',
            'Dedicated support',
            'API access',
        ],
    },
];

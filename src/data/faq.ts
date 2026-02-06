import { IFAQ } from "@/types";
import { siteDetails } from "./site-details";

export const faqs: IFAQ[] = [
    {
        question: `Is ${siteDetails.siteName} free to try?`,
        answer: 'Yes. You can generate a limited number of recipes per month for free. Upgrade to Pro for unlimited generations and meal planning.',
    },
    {
        question: `Can I use ${siteDetails.siteName} on my phone?`,
        answer: 'Absolutely! Recipe Generator works on any device — phone, tablet, or computer. Your saved recipes sync across all devices.',
    },
    {
        question: 'What if I have allergies or dietary restrictions?',
        answer: `Yes! ${siteDetails.siteName} lets you set dietary preferences (gluten-free, vegan, nut-free, etc.) so every recipe fits your needs.`,
    },
    {
        question: 'Do I need to create an account?',
        answer: 'You can try a few recipes without signing up. Creating a free account lets you save recipes, create meal plans, and sync across devices.',
    },
    {
        question: 'How does the AI choose recipes?',
        answer: 'You tell us what ingredients you have (and what you avoid). Our AI suggests recipes that match, with clear instructions and optional substitutions.',
    }
];

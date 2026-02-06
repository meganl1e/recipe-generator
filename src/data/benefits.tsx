import { FiBook, FiClock, FiShoppingCart, FiZap } from "react-icons/fi";

import { IBenefit } from "@/types"

export const benefits: IBenefit[] = [
    {
        title: "Ingredients to Recipes in Seconds",
        description: "Type what you have in the fridge or pantry. Get tailored recipe ideas that use those ingredients and match your diet.",
        bullets: [
            { title: "Smart Matching", description: "Our AI finds recipes that actually use your ingredients.", icon: <FiZap size={26} /> },
            { title: "Dietary Filters", description: "Vegan, keto, gluten-free, and more — filter by what works for you.", icon: <FiBook size={26} /> },
            { title: "Substitutions", description: "Missing an ingredient? We suggest swaps so you can still cook.", icon: <FiShoppingCart size={26} /> }
        ],
        imageSrc: "/images/mockup-1.webp"
    },
    {
        title: "Meal Planning Made Simple",
        description: "Plan a week of dinners and get a single grocery list. No more last-minute takeout or wasted food.",
        bullets: [
            { title: "Weekly Plans", description: "Generate a full week of recipes that share ingredients.", icon: <FiClock size={26} /> },
            { title: "One List", description: "One consolidated shopping list for your whole plan.", icon: <FiShoppingCart size={26} /> },
            { title: "Save Favorites", description: "Bookmark recipes and reuse them in future plans.", icon: <FiBook size={26} /> }
        ],
        imageSrc: "/images/mockup-2.webp"
    },
    {
        title: "Clear, Step-by-Step Instructions",
        description: "Every recipe comes with simple directions, cook times, and serving sizes so you can cook with confidence.",
        bullets: [
            { title: "Structured Steps", description: "Follow along with numbered, easy-to-read instructions.", icon: <FiBook size={26} /> },
            { title: "Timing & Servings", description: "Know how long it takes and how many it feeds.", icon: <FiClock size={26} /> },
            { title: "Print & Share", description: "Print or share recipes with family and friends.", icon: <FiZap size={26} /> }
        ],
        imageSrc: "/images/mockup-1.webp"
    },
];

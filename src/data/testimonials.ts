import { ITestimonial } from "@/types";
import { siteDetails } from "./site-details";

export const testimonials: ITestimonial[] = [
    {
        name: 'Sarah M.',
        role: 'Home cook',
        message: `${siteDetails.siteName} cut my "what's for dinner?" stress to zero. I type in what's in my fridge and get real recipes I can actually make.`,
        avatar: '/images/testimonial-1.webp',
    },
    {
        name: 'James K.',
        role: 'Busy parent',
        message: `Meal planning used to take hours. Now ${siteDetails.siteName} suggests a week of dinners and a grocery list in one click. Game changer.`,
        avatar: '/images/testimonial-2.webp',
    },
    {
        name: 'Elena R.',
        role: 'Food blogger',
        message: `I use ${siteDetails.siteName} for inspiration when I'm stuck. The dietary filters and ingredient-based search are exactly what I needed.`,
        avatar: '/images/testimonial-3.webp',
    },
];

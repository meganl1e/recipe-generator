import { IMenuItem, ISocials } from "@/types";

export const footerDetails: {
    subheading: string;
    quickLinks: IMenuItem[];
    email: string;
    telephone: string;
    socials: ISocials;
} = {
    subheading: "AI-powered recipe ideas and meal planning for home cooks.",
    quickLinks: [
        { text: "Features", url: "#features" },
        { text: "Pricing", url: "#pricing" },
        { text: "Testimonials", url: "#testimonials" }
    ],
    email: 'hello@recipegenerator.example.com',
    telephone: '+1 (123) 456-7890',
    socials: {
        twitter: 'https://twitter.com',
        facebook: 'https://facebook.com',
        linkedin: 'https://www.linkedin.com',
        instagram: 'https://www.instagram.com',
    }
};

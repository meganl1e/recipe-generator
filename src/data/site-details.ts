export const siteDetails = {
    siteName: 'DIY Dog Food',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://diy-dog-food.example.com/', // NEED TO CHANGE TO WHATEVER THE URL IS LATER
    metadata: {
        title: 'DIY Dog Food | Safe, Healthy Recipes for Your Pup',
        description: 'Build balanced homemade dog food recipes in seconds. Choose dog-safe ingredients and get balanced meal ideas tailored to your dog. Free DIY dog food recipe generator.',
        keywords: [
            'homemade dog food',
            'dog food recipe generator',
            'DIY dog food',
            'healthy dog food recipes',
            'homemade dog food recipes',
            'dog meal planner',
            'natural dog food',
        ],
    },
    generator: {
        title: 'DIY Dog Food Recipe Generator',
        description: 'Generate custom homemade dog food recipes. Pick dog-safe ingredients and get balanced meal ideas. No signup required.',
    },
    language: 'en-us',
    locale: 'en-US',
    siteLogo: `${process.env.BASE_PATH || ''}/images/logo.png`,
    googleAnalyticsId: '',
};

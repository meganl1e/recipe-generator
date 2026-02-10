import React from 'react';
import Link from 'next/link';

import { heroDetails } from '@/data/hero';

const Hero: React.FC = () => {
    return (
        <section
            id="hero"
            className="relative flex items-center justify-center pb-20 pt-32 md:pt-40 px-5"
        >

            {/* green hero background, subtle highlight */}
            <div className="absolute inset-0 -z-10 bg-hero-background bg-[radial-gradient(circle_at_bottom,#ffffff80_0%,transparent_55%),linear-gradient(to_top,rgba(0,0,0,0.14)_0%,transparent_60%)]" />

            <div className="text-center">
                <h1 className="text-4xl md:text-6xl md:leading-tight font-bold text-foreground max-w-lg md:max-w-2xl mx-auto">{heroDetails.heading}</h1>
                <p className="mt-4 text-foreground max-w-lg mx-auto">{heroDetails.subheading}</p>
                <div className="mt-8 flex justify-center">
                    <Link
                        href="/generator"
                        className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-foreground font-medium hover:bg-primary-accent transition-colors"
                    >
                        {heroDetails.ctaLabel}
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;

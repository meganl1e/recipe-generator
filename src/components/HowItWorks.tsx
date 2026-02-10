"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

const steps = [
    "Enter your dog’s details.",
    "Choose the ingredients you want to use.",
    "Get recipe ideas tailored to your dog.",
];

const containerVariants: Variants = {
    offscreen: {
        opacity: 0,
        y: 60,
    },
    onscreen: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            bounce: 0.2,
            duration: 0.8,
            delayChildren: 0.15,
            staggerChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    offscreen: {
        opacity: 0,
        y: 40,
    },
    onscreen: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", bounce: 0.25, duration: 0.6 },
    },
};

export default function HowItWorks() {
    return (
        <section className="py-24 md:py-32 px-5 bg-background border-t border-black/5">
            <motion.div
                className="max-w-2xl mx-auto text-center"
                variants={containerVariants}
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, margin: "-80px" }}
            >
                <motion.h2
                    variants={itemVariants}
                    className="text-3xl md:text-4xl font-semibold text-foreground mb-12 md:mb-14"
                >
                    How it works
                </motion.h2>
                <ol className="space-y-6 md:space-y-8 mb-12 md:mb-14">
                    {steps.map((step, i) => (
                        <motion.li
                            key={i}
                            variants={itemVariants}
                            className="flex gap-4 md:gap-5 text-left items-center"
                        >
                            <span className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/30 text-foreground text-lg md:text-xl font-semibold flex items-center justify-center">
                                {i + 1}
                            </span>
                            <span className="text-lg md:text-xl text-foreground/90 leading-snug">
                                {step}
                            </span>
                        </motion.li>
                    ))}
                </ol>
                <motion.p
                    variants={itemVariants}
                    className="text-base md:text-lg text-foreground/75 mb-10 md:mb-12"
                >
                    Recipes are balanced to meet AAFCO nutrient guidelines. Free, no signup required.
                </motion.p>
                <motion.div variants={itemVariants}>
                    <Link
                        href="/generator"
                        className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-foreground text-base md:text-lg font-medium hover:bg-primary-accent transition-colors"
                    >
                        Let's Get Cooking
                    </Link>
                </motion.div>
            </motion.div>
        </section>
    );
}

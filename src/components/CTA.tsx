import Link from "next/link";
import { ctaDetails } from "@/data/cta";

const CTA: React.FC = () => {
    return (
        <section id="cta" className="mt-10 mb-5 lg:my-20">
            <div className="relative h-full w-full z-10 mx-auto py-12 sm:py-20">
                <div className="h-full w-full">
                    <div className="rounded-3xl opacity-95 absolute inset-0 -z-10 h-full w-full bg-[#2d2818] bg-[linear-gradient(to_right,#3a3528_1px,transparent_1px),linear-gradient(to_bottom,#3a3528_1px,transparent_1px)] bg-[size:6rem_4rem]">
                        <div className="rounded-3xl absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_600px_at_50%_500px,#3d3529,transparent)]"></div>
                    </div>

                    <div className="h-full flex flex-col items-center justify-center text-amber-50 text-center px-5">
                        <h2 className="text-2xl sm:text-3xl md:text-5xl md:leading-tight font-semibold mb-4 max-w-2xl">{ctaDetails.heading}</h2>
                        <p className="mx-auto max-w-xl md:px-5">{ctaDetails.subheading}</p>
                        <div className="mt-6">
                            <Link
                                href="/generator"
                                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-foreground font-medium hover:bg-primary-accent transition-colors"
                            >
                                {ctaDetails.ctaLabel}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA

import Link from 'next/link';
import React from 'react';
import { FaUtensils } from 'react-icons/fa';

import { siteDetails } from '@/data/site-details';
import { footerDetails } from '@/data/footer';

const Footer: React.FC = () => {
    return (
        <footer className="bg-hero-background text-foreground py-6">
            <div className="max-w-7xl w-full mx-auto px-6 flex items-center justify-center gap-2 text-sm text-foreground-accent">
                <FaUtensils className="w-4 h-4" />
                <span>{siteDetails.siteName}</span>
                {footerDetails.email && (
                    <>
                        <span>·</span>
                        <a
                            href={`mailto:${footerDetails.email}`}
                            className="hover:text-foreground underline-offset-2 hover:underline"
                        >
                            {footerDetails.email}
                        </a>
                    </>
                )}
            </div>
        </footer>
    );
};

export default Footer;

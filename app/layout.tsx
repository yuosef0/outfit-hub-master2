import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";



import { Playfair_Display } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
    weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store'),
    title: {
        default: 'Outfit Hub - Click & Collect Fashion | تسوق أزياء واستلم من المحل',
        template: '%s | Outfit Hub',
    },
    description: 'اكتشف أقرب محلات الأزياء والملابس في مصر، تصفح المنتجات واستلم طلبك من المحل. Discover local fashion stores near you, browse products, and pick up your order easily.',
    keywords: [
        'ملابس', 'أزياء', 'موضة', 'تسوق', 'محلات ملابس', 'ملابس اون لاين',
        'شراء ملابس', 'أزياء مصر', 'ملابس نسائي', 'ملابس رجالي', 'ملابس أطفال',
        'عروض ملابس', 'تخفيضات', 'أوت فت هب', 'استلم من المحل',
        'محلات أزياء القاهرة', 'محلات أزياء الإسكندرية', 'محلات أزياء الجيزة',
        'تسوق ملابس مصر', 'أفضل محلات ملابس', 'ملابس بنات',
        'فساتين', 'بلوزات', 'بناطيل', 'جاكيتات', 'أحذية', 'اكسسوارات',
        'outfit hub', 'click and collect fashion', 'fashion egypt',
        'clothing stores egypt', 'online fashion shopping egypt',
        'buy clothes egypt', 'fashion stores cairo', 'fashion stores alexandria',
        'mens clothing egypt', 'womens clothing egypt', 'kids clothing egypt',
        'fashion deals egypt', 'local fashion stores', 'pickup fashion egypt',
    ],
    authors: [{ name: 'Outfit Hub' }],
    creator: 'Outfit Hub',
    publisher: 'Outfit Hub',
    openGraph: {
        type: 'website',
        locale: 'ar_EG',
        alternateLocale: 'en_US',
        url: '/',
        siteName: 'Outfit Hub',
        title: 'Outfit Hub - Click & Collect Fashion | تسوق أزياء واستلم من المحل',
        description: 'اكتشف أقرب محلات الأزياء والملابس في مصر. تصفح، اختار، واستلم من أقرب محل. Discover local fashion stores, browse products and pick up your order.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Outfit Hub - Click & Collect Fashion',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Outfit Hub - Click & Collect Fashion',
        description: 'اكتشف أقرب محلات الأزياء والملابس في مصر. تصفح، اختار، واستلم من أقرب محل.',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: '/',
    },
    category: 'fashion',
};

import { Providers } from "@/components/Providers";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Organization',
                            name: 'Outfit Hub',
                            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store',
                            logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store'}/og-image.png`,
                            description: 'منصة تسوق أزياء Click & Collect في مصر. اكتشف محلات الملابس القريبة منك واستلم طلبك بسهولة.',
                            contactPoint: {
                                '@type': 'ContactPoint',
                                contactType: 'customer service',
                                availableLanguage: ['Arabic', 'English'],
                            },
                            sameAs: [],
                        }),
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'WebSite',
                            name: 'Outfit Hub',
                            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store',
                            potentialAction: {
                                '@type': 'SearchAction',
                                target: {
                                    '@type': 'EntryPoint',
                                    urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store'}/stores?q={search_term_string}`,
                                },
                                'query-input': 'required name=search_term_string',
                            },
                        }),
                    }}
                />
            </head>
            <body
                className={`${inter.variable} ${playfair.variable} font-display bg-background-light text-text-light-primary antialiased selection:bg-primary selection:text-white`}
                suppressHydrationWarning
            >
                <Providers>
                    <MainLayoutWrapper>
                        {children}
                    </MainLayoutWrapper>
                </Providers>
            </body>
        </html>
    );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from '@/components/BottomNav';


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
    title: "Outfit Hub - Click & Collect Fashion",
    description: "Discover local stores, find what you love, and pick it up easily",
};

import { Providers } from "@/components/Providers";
import CartManager from "@/components/CartManager";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ... existing imports

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
            </head>
            <body
                className={`${inter.variable} ${playfair.variable} font-display bg-background-light text-text-light-primary antialiased selection:bg-primary selection:text-white`}
                suppressHydrationWarning
            >
                <Providers>
                    <Header />
                    {children}
                    <Footer />
                    <CartManager />
                    <BottomNav />
                </Providers>
            </body>
        </html>
    );
}

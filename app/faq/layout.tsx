import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'FAQ - Frequently Asked Questions | الأسئلة الشائعة',
    description: 'إجابات على الأسئلة الشائعة عن Outfit Hub. كيف تتسوق، كيف تستلم طلبك، وكل ما تحتاج معرفته. Frequently asked questions about shopping on Outfit Hub.',
    keywords: ['faq outfit hub', 'الأسئلة الشائعة', 'كيف أتسوق', 'how to shop', 'click and collect help'],
    openGraph: {
        title: 'FAQ | الأسئلة الشائعة - Outfit Hub',
        description: 'إجابات على أهم الأسئلة عن التسوق على Outfit Hub.',
    },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
    return children;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Outfit Hub | عن أوت فت هب',
    description: 'تعرف على Outfit Hub - منصة تسوق الأزياء Click & Collect في مصر. اكتشف محلات الملابس القريبة منك واستلم طلبك بسهولة.',
    keywords: ['about outfit hub', 'عن أوت فت هب', 'منصة أزياء مصر', 'تسوق ملابس', 'click and collect egypt'],
    openGraph: {
        title: 'About Outfit Hub | عن أوت فت هب',
        description: 'تعرف على Outfit Hub - منصة تسوق الأزياء Click & Collect في مصر.',
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return children;
}

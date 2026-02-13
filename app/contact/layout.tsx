import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us | تواصل معنا',
    description: 'تواصل مع فريق Outfit Hub. نحن هنا لمساعدتك في أي استفسار عن التسوق أو المحلات أو الطلبات. Contact Outfit Hub support team.',
    keywords: ['contact outfit hub', 'تواصل معنا', 'دعم العملاء', 'customer support'],
    openGraph: {
        title: 'Contact Us | تواصل معنا - Outfit Hub',
        description: 'تواصل مع فريق Outfit Hub. نحن هنا لمساعدتك.',
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}

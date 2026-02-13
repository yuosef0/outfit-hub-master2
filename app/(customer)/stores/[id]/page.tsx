import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import StoreProfileClient from './StoreProfileClient';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    const { data: store } = await supabase
        .from('stores')
        .select('name, description, logo_url, category, address, governorate')
        .eq('id', id)
        .single();

    if (!store) {
        return { title: 'Store Not Found' };
    }

    const title = `${store.name} - ${store.category || 'Fashion Store'}`;
    const description = store.description
        || `تصفح منتجات ${store.name} على Outfit Hub. ${store.address ? `العنوان: ${store.address}.` : ''} اختار واستلم من المحل.`;
    const image = store.logo_url || `${SITE_URL}/og-image.png`;

    return {
        title,
        description,
        keywords: [
            store.name,
            store.category || '',
            store.governorate || '',
            `محل ${store.name}`, `${store.name} مصر`,
            'محلات ملابس', 'أزياء', 'outfit hub',
        ].filter(Boolean),
        openGraph: {
            title,
            description,
            url: `/stores/${id}`,
            images: [{ url: image, alt: store.name }],
            type: 'website',
            siteName: 'Outfit Hub',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: store } = await supabase
        .from('stores')
        .select('name, description, logo_url, category, address, phone, opening_time, closing_time')
        .eq('id', id)
        .single();

    const jsonLd = store ? {
        '@context': 'https://schema.org',
        '@type': 'ClothingStore',
        name: store.name,
        description: store.description || `${store.name} - Fashion store on Outfit Hub`,
        image: store.logo_url,
        address: store.address ? {
            '@type': 'PostalAddress',
            streetAddress: store.address,
            addressCountry: 'EG',
        } : undefined,
        telephone: store.phone,
        url: `${SITE_URL}/stores/${id}`,
        openingHoursSpecification: store.opening_time && store.closing_time ? {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: store.opening_time,
            closes: store.closing_time,
        } : undefined,
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <StoreProfileClient />
        </>
    );
}

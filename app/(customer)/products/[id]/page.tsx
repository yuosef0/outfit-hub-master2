import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProductDetailClient from './ProductDetailClient';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    const { data: product } = await supabase
        .from('products')
        .select('name, description, price, image_urls, category, stores:store_id(name)')
        .eq('id', id)
        .single();

    if (!product) {
        return { title: 'Product Not Found' };
    }

    const storeName = (product.stores as any)?.name || 'Outfit Hub';
    const title = `${product.name} - ${storeName}`;
    const description = product.description
        || `تسوق ${product.name} بسعر ${product.price} جنيه من ${storeName} على Outfit Hub. استلم من أقرب فرع.`;
    const image = product.image_urls?.[0] || `${SITE_URL}/og-image.png`;

    return {
        title,
        description,
        keywords: [
            product.name,
            product.category || '',
            storeName,
            'شراء ملابس', 'تسوق أزياء', 'outfit hub',
            `شراء ${product.name}`, `${product.name} مصر`,
        ].filter(Boolean),
        openGraph: {
            title,
            description,
            url: `/products/${id}`,
            images: [{ url: image, alt: product.name }],
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

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: product } = await supabase
        .from('products')
        .select('name, description, price, image_urls, stock_quantity, category, stores:store_id(name)')
        .eq('id', id)
        .single();

    const jsonLd = product ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || `${product.name} available on Outfit Hub`,
        image: product.image_urls || [],
        category: product.category,
        brand: {
            '@type': 'Brand',
            name: (product.stores as any)?.name || 'Outfit Hub',
        },
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'EGP',
            availability: product.stock_quantity > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}/products/${id}`,
            seller: {
                '@type': 'Organization',
                name: (product.stores as any)?.name || 'Outfit Hub',
            },
        },
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProductDetailClient />
        </>
    );
}

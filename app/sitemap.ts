import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
        { url: `${SITE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}/stores`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${SITE_URL}/return-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ];

    // Dynamic: Categories
    const { data: categories } = await supabase
        .from('categories')
        .select('name, created_at')
        .eq('is_active', true);

    const categoryPages: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
        url: `${SITE_URL}/categories/${encodeURIComponent(cat.name.toLowerCase())}`,
        lastModified: new Date(cat.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // Dynamic: Stores
    const { data: stores } = await supabase
        .from('stores')
        .select('id, updated_at')
        .eq('is_active', true);

    const storePages: MetadataRoute.Sitemap = (stores || []).map((store) => ({
        url: `${SITE_URL}/stores/${store.id}`,
        lastModified: new Date(store.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // Dynamic: Products
    const { data: products } = await supabase
        .from('products')
        .select('id, updated_at')
        .eq('is_active', true);

    const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
        url: `${SITE_URL}/products/${product.id}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...storePages, ...productPages];
}

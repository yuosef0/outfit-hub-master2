import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import CategoryDetailClient from './CategoryDetailClient';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const categoryName = slug.replace(/-/g, ' ');

    const { data: category } = await supabase
        .from('categories')
        .select('name, name_ar, description, image_url')
        .ilike('name', categoryName)
        .single();

    if (!category) {
        return { title: 'Category Not Found' };
    }

    const title = `${category.name}${category.name_ar ? ` - ${category.name_ar}` : ''} | محلات ومنتجات`;
    const description = category.description
        || `تصفح أفضل محلات ${category.name_ar || category.name} في مصر على Outfit Hub. اكتشف أحدث الأزياء واستلم من أقرب فرع.`;

    return {
        title,
        description,
        keywords: [
            category.name,
            category.name_ar || '',
            `محلات ${category.name_ar || category.name}`,
            `${category.name} egypt`, `${category.name} fashion`,
            'أزياء', 'ملابس', 'outfit hub',
        ].filter(Boolean),
        openGraph: {
            title,
            description,
            url: `/categories/${slug}`,
            images: category.image_url ? [{ url: category.image_url, alt: category.name }] : undefined,
            type: 'website',
            siteName: 'Outfit Hub',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: category.image_url ? [category.image_url] : undefined,
        },
    };
}

export default function CategoryPage() {
    return <CategoryDetailClient />;
}

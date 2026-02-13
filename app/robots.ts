import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://outfithub.store';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/merchant/', '/api/', '/auth/callback'],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}

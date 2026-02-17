import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Outfit Hub - Click & Collect Fashion',
        short_name: 'Outfit Hub',
        description: 'اكتشف أقرب محلات الأزياء والملابس في مصر، تصفح المنتجات واستلم طلبك من المحل. Discover local fashion stores near you.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#1a1a2e',
        orientation: 'portrait',
        categories: ['shopping', 'fashion', 'lifestyle'],
        lang: 'ar',
        dir: 'rtl',
        icons: [
            {
                src: '/favicon.ico',
                sizes: '64x64',
                type: 'image/x-icon',
            },
            {
                src: '/og-image.png',
                sizes: '1200x630',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    }
}

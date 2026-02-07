'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, LayoutGroup } from 'framer-motion';

import { useCartUI } from '@/context/CartUIContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface NavItem {
    key: string;
    path: string | null;
    icon: string;
    labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
    { key: 'stores', path: '/stores', icon: 'storefront', labelKey: 'footer.stores' },
    { key: 'categories', path: '/categories', icon: 'category', labelKey: 'categories.title' },
    { key: 'home', path: '/', icon: 'home', labelKey: 'nav.home' },
    { key: 'cart', path: '/cart', icon: 'shopping_cart', labelKey: 'nav.cart' },
    { key: 'saved', path: '/saved', icon: 'favorite', labelKey: 'nav.saved' },
];

/**
 * Reorder the items so that the active one is always at center (index 2).
 * Items wrap around circularly.
 */
function getReorderedItems(activeKey: string): NavItem[] {
    const n = NAV_ITEMS.length;
    const activeIdx = NAV_ITEMS.findIndex((item) => item.key === activeKey);
    const idx = activeIdx >= 0 ? activeIdx : 2;

    const result: NavItem[] = [];
    for (let offset = -2; offset <= 2; offset++) {
        const i = ((idx + offset) % n + n) % n;
        result.push(NAV_ITEMS[i]);
    }
    return result;
}

const CENTER_INDEX = 2;
const CURVE_WIDTH = 72;
const NAV_HEIGHT = 70;
const TOP_LINE = 14;

// Static SVG path — curve is always at center position
const STATIC_CURVE_PATH = buildCurvePath(CENTER_INDEX, 5, CURVE_WIDTH, TOP_LINE, NAV_HEIGHT + 20);

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { openCart } = useCartUI();
    const [cartCount, setCartCount] = useState(0);
    const [activeKey, setActiveKey] = useState<string>('home');
    const { t } = useLanguage();

    // Hide BottomNav on merchant pages
    if (pathname.startsWith('/merchant')) {
        return null;
    }

    // Sync activeKey with the current route
    useEffect(() => {
        const match = NAV_ITEMS.find((item) => item.path === pathname);
        if (match) setActiveKey(match.key);
    }, [pathname]);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Fetch cart count
    useEffect(() => {
        const fetchCartCount = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setCartCount(0); return; }

            const { data, error } = await supabase
                .from('cart_items')
                .select('quantity')
                .eq('user_id', user.id);

            if (!error && data) {
                setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
            }
        };

        fetchCartCount();
        const interval = setInterval(fetchCartCount, 5000);
        return () => clearInterval(interval);
    }, [supabase]);

    const handleItemClick = (item: NavItem) => {
        setActiveKey(item.key);
        if (item.path) {
            router.push(item.path);
        }
    };

    const reorderedItems = getReorderedItems(activeKey);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ height: NAV_HEIGHT + 20 }}>
            {/* SVG Background — curve is always at center */}
            <div className="absolute bottom-0 w-full pointer-events-none" style={{ height: NAV_HEIGHT + 20 }}>
                <svg
                    viewBox={`0 0 375 ${NAV_HEIGHT + 20}`}
                    preserveAspectRatio="none"
                    className="w-full h-full"
                    style={{ filter: 'drop-shadow(0 -4px 12px rgba(0,0,0,0.15))' }}
                >
                    <path className="fill-background-light" d={STATIC_CURVE_PATH} />
                </svg>
            </div>

            {/* Nav Items — reorder so active is always center */}
            <LayoutGroup>
                <div
                    className="relative flex items-end justify-around px-2"
                    style={{ height: NAV_HEIGHT + 20 }}
                >
                    {reorderedItems.map((item, displayIndex) => {
                        const isCenter = displayIndex === CENTER_INDEX;

                        return (
                            <motion.div
                                key={item.key}
                                layout
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                className="flex-1 flex flex-col items-center relative"
                                style={{ height: NAV_HEIGHT + 20 }}
                            >
                                {/* Raised circle — only the center item */}
                                {isCenter && (
                                    <div
                                        className="absolute flex items-center justify-center w-[52px] h-[52px] rounded-full bg-cream shadow-lg shadow-cream/30 z-10"
                                        style={{ top: -6 }}
                                    >
                                        <span className="material-symbols-outlined text-primary text-[26px]">
                                            {item.icon}
                                        </span>
                                        {item.key === 'cart' && cartCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-cream">
                                                {cartCount > 9 ? '9+' : cartCount}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Clickable area */}
                                <button
                                    onClick={() => handleItemClick(item)}
                                    className={`flex flex-col items-center justify-end pb-6 w-full h-full transition-colors ${isCenter ? '' : 'text-text-light-secondary hover:text-text-light-primary active:scale-95'
                                        }`}
                                >
                                    {!isCenter && (
                                        <div className="relative mb-0.5">
                                            <span className="material-symbols-outlined text-[24px]">
                                                {item.icon}
                                            </span>
                                            {item.key === 'cart' && cartCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-background-light">
                                                    {cartCount > 9 ? '9+' : cartCount}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <p className={`text-[10px] font-bold leading-none tracking-wide ${isCenter ? 'text-cream' : 'text-text-light-secondary'
                                        }`}>
                                        {t(item.labelKey)}
                                    </p>
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </LayoutGroup>
        </div>
    );
}

/**
 * Build the SVG path for the bottom nav background with a notch/curve
 * centered on the item at `activeIndex` out of 5 items.
 */
function buildCurvePath(
    activeIndex: number,
    totalItems: number,
    curveWidth: number,
    topY: number,
    height: number
): string {
    const segmentWidth = 375 / totalItems;
    const centerX = segmentWidth * activeIndex + segmentWidth / 2;

    const halfCurve = curveWidth / 2;
    const curveDepth = 28;

    const leftStart = centerX - halfCurve;
    const rightEnd = centerX + halfCurve;

    const cp1x = leftStart + 12;
    const cp2x = centerX - 14;
    const cp3x = centerX + 14;
    const cp4x = rightEnd - 12;

    return `
        M 0,${topY}
        L ${leftStart},${topY}
        C ${cp1x},${topY} ${cp2x},${topY + curveDepth} ${centerX},${topY + curveDepth}
        C ${cp3x},${topY + curveDepth} ${cp4x},${topY} ${rightEnd},${topY}
        L 375,${topY}
        L 375,${height}
        L 0,${height}
        Z
    `.trim();
}

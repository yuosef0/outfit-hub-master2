'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function MerchantNav() {
 const pathname = usePathname();
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

 const navItems = [
 { name: 'Dashboard', path: '/merchant/dashboard', icon: 'dashboard' },
 { name: 'المنتجات', path: '/merchant/products', icon: 'inventory_2' },
 { name: 'الطلبات', path: '/merchant/orders', icon: 'shopping_bag' },
 { name: 'التحليلات', path: '/merchant/analytics', icon: 'analytics' },
 { name: 'التقييمات', path: '/merchant/reviews', icon: 'star' },
 { name: 'الكوبونات', path: '/merchant/coupons', icon: 'local_offer' },
 { name: 'الإعدادات', path: '/merchant/settings', icon: 'settings' },
 ];

 const isActive = (path: string) => pathname === path;

 return (
 <>
 {/* Desktop Sidebar */}
 <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-surface-light border-r border-border-light">
 {/* Logo */}
 <div className="flex items-center gap-2 h-16 px-6 border-b border-border-light">
 <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-white text-xl">store</span>
 </div>
 <span className="font-bold text-lg text-text-light-primary">Outfit Hub</span>
 </div>

 {/* Navigation */}
 <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
 {navItems.map((item) => (
 <Link
 key={item.path}
 href={item.path}
 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
 ? 'bg-primary text-white'
 : 'text-text-light-secondary hover:bg-card-light hover:text-text-light-primary'
 }`}
 >
 <span className="material-symbols-outlined text-xl">{item.icon}</span>
 <span className="font-medium">{item.name}</span>
 </Link>
 ))}
 </nav>

 {/* User Section */}
 <div className="p-4 border-t border-border-light">
 <Link
 href="/profile"
 className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-light transition-colors"
 >
 <div className="w-8 h-8 bg-card-light rounded-full flex items-center justify-center">
 <span className="material-symbols-outlined text-text-light-secondary">person</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-text-light-primary truncate">التاجر</p>
 <p className="text-xs text-text-light-secondary">عرض الملف الشخصي</p>
 </div>
 </Link>
 </div>
 </aside>

 {/* Mobile Header */}
 <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface-light border-b border-border-light">
 <div className="flex items-center justify-between h-16 px-4">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-white text-xl">store</span>
 </div>
 <span className="font-bold text-lg text-text-light-primary">Outfit Hub</span>
 </div>
 <button
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 className="p-2 rounded-lg hover:bg-card-light"
 >
 <span className="material-symbols-outlined text-text-light-primary">
 {mobileMenuOpen ? 'close' : 'menu'}
 </span>
 </button>
 </div>

 {/* Mobile Menu */}
 {mobileMenuOpen && (
 <nav className="px-4 py-4 space-y-1 border-t border-border-light">
 {navItems.map((item) => (
 <Link
 key={item.path}
 href={item.path}
 onClick={() => setMobileMenuOpen(false)}
 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
 ? 'bg-primary text-white'
 : 'text-text-light-secondary hover:bg-card-light hover:text-text-light-primary'
 }`}
 >
 <span className="material-symbols-outlined text-xl">{item.icon}</span>
 <span className="font-medium">{item.name}</span>
 </Link>
 ))}
 </nav>
 )}
 </header>

 {/* Mobile Spacer */}
 <div className="lg:hidden h-16"></div>
 </>
 );
}

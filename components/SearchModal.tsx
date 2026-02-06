'use client';

import React, { useEffect, useState } from 'react';

interface SearchModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
 const [shouldRender, setShouldRender] = useState(false);
 const [searchTerm, setSearchTerm] = useState('Summer Dress');

 useEffect(() => {
 if (isOpen) {
 setShouldRender(true);
 document.body.style.overflow = 'hidden';
 } else {
 const timer = setTimeout(() => setShouldRender(false), 300); // Wait for animation
 document.body.style.overflow = '';
 return () => clearTimeout(timer);
 }
 }, [isOpen]);

 if (!shouldRender) return null;

 return (
 <div
 className={`fixed inset-0 z-[100] bg-background-light transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'
 }`}
 >
 <div className="relative flex flex-col h-full w-full mx-auto overflow-x-hidden bg-background-light group/design-root overflow-y-auto">
 {/* Sticky Header Group */}
 <div className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md border-b border-border-light">
 {/* Status Bar Spacer for iOS */}
 <div className="h-4 w-full"></div>
 {/* Search Bar Area */}
 <div className="px-4 pb-2 flex items-center gap-3">
 <button
 onClick={onClose}
 aria-label="Close Search"
 className="p-2 rounded-full hover:bg-card-light transition-colors"
 >
 <svg xmlns="http://www.w3.org/2000/svg"width="28"height="28"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"strokeLinejoin="round"className="text-text-light-primary">
 <path d="M18 6L6 18M6 6l12 12"/>
 </svg>
 </button>
 <div className="flex-1 relative group">
 <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">search</span>
 </div>
 <input
 className="w-full bg-card-light border-none rounded-xl py-3 pl-10 pr-10 text-base placeholder-text-light-secondary text-text-light-primary focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
 placeholder="Search products, stores..."
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 autoFocus
 />
 <button
 onClick={() => setSearchTerm('')}
 aria-label="Clear search"
 className="absolute inset-y-0 right-2 flex items-center justify-center p-1 text-text-light-secondary hover:text-text-light-primary"
 >
 <span className="material-symbols-outlined text-[20px]">cancel</span>
 </button>
 </div>
 <button aria-label="Voice Search"className="p-2 -mr-2 rounded-full hover:bg-card-light transition-colors text-text-light-primary">
 <span className="material-symbols-outlined text-[24px]">mic</span>
 </button>
 </div>
 {/* Tabs */}
 <div className="flex items-center px-4 gap-6 pt-2 overflow-x-auto no-scrollbar">
 <button className="flex flex-col items-center gap-2 pb-3 min-w-[3rem] border-b-[3px] border-primary text-primary font-bold text-sm whitespace-nowrap">
 All
 </button>
 <button className="flex flex-col items-center gap-2 pb-3 min-w-[3rem] border-b-[3px] border-transparent text-text-light-secondary hover:text-text-light-primary font-medium text-sm whitespace-nowrap transition-colors">
 Products
 </button>
 <button className="flex flex-col items-center gap-2 pb-3 min-w-[3rem] border-b-[3px] border-transparent text-text-light-secondary hover:text-text-light-primary font-medium text-sm whitespace-nowrap transition-colors">
 Stores
 </button>
 </div>
 </div>
 {/* Filter & Sort & Chips Row */}
 <div className="flex flex-col gap-3 py-4 px-4 bg-background-light">
 {/* Chips (Categories/Refinement) */}
 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-full border border-primary whitespace-nowrap active:scale-95 transition-transform">
 <span className="text-white text-xs font-semibold">On Sale</span>
 <span className="material-symbols-outlined text-[16px] text-white">close</span>
 </button>
 <button className="flex items-center gap-1.5 px-4 py-1.5 bg-card-light rounded-full border border-transparent whitespace-nowrap active:scale-95 transition-transform">
 <span className="text-text-light-primary text-sm font-bold">Dresses</span>
 </button>
 <button className="flex items-center gap-1.5 px-4 py-1.5 bg-card-light rounded-full border border-transparent whitespace-nowrap active:scale-95 transition-transform">
 <span className="text-text-light-primary text-sm font-bold">Casual</span>
 </button>
 <button className="flex items-center gap-1.5 px-4 py-1.5 bg-card-light rounded-full border border-transparent whitespace-nowrap active:scale-95 transition-transform">
 <span className="text-text-light-primary text-sm font-bold">Summer</span>
 </button>
 <button className="flex items-center gap-1.5 px-4 py-1.5 bg-card-light rounded-full border border-transparent whitespace-nowrap active:scale-95 transition-transform">
 <span className="text-text-light-primary text-sm font-bold">Floral</span>
 </button>
 </div>
 {/* Utility Row */}
 <div className="flex items-center justify-between mt-1">
 <p className="text-sm font-bold text-text-light-primary">124 Results</p>
 <div className="flex items-center gap-3">
 <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-card-light text-text-light-primary transition-colors">
 <span className="material-symbols-outlined text-[20px]">tune</span>
 <span className="text-sm font-bold text-text-light-primary">Filter</span>
 </button>
 <div className="w-px h-4 bg-border-light"></div>
 <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-card-light text-text-light-primary transition-colors">
 <span className="text-sm font-bold text-text-light-primary">Relevance</span>
 <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
 </button>
 </div>
 </div>
 </div>
 {/* Product Grid */}
 <div className="grid grid-cols-2 gap-4 px-4 pb-20">
 {/* Product Card 1 */}
 <div className="group flex flex-col gap-2 cursor-pointer">
 <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-dark">
 <img
 alt="Summer Floral Dress"
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
 data-alt="Woman wearing white floral summer dress"
 src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8_jjVsn2U3u9wQ4WDj3035SvP4khW_qGbzZNWLVG-qDgGJdvAx41EV0fJlhxRpWsHsXYNooXBwvc6Ld_zUTTeOVEuMxaSt2SaaBBBzZb6eyaPwcJ_yLsoU4fAnfegvvd_F5XTnldYxlm8D7RAKJVZRu1nRBDql3B7YeXvLf8oPxT0NL5MkJZpDUcG-OjG6FazhR33yBrEp-D8KA6Oz8aBux7-b_EQ6_9ax4RxhVnsrq88uEBGRbrmSBw40kDLQGr3nsbtWOYktdE"
 />
 <button className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card-light/70 backdrop-blur-sm text-text-light-primary hover:text-rose-400 transition-all shadow-sm">
 <span className="material-symbols-outlined text-[18px]">favorite</span>
 </button>
 <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded text-[10px] font-bold text-background-light uppercase tracking-wider shadow-sm">
 Best Seller
 </div>
 </div>
 <div className="flex flex-col gap-1 p-1">
 <div className="flex items-center justify-between">
 <p className="text-xs font-bold text-text-light-primary">Urban Outfitters</p>
 <div className="flex items-center gap-0.5">
 <span className="material-symbols-outlined text-[14px] text-amber-400 fill">star</span>
 <span className="text-sm font-bold text-text-light-primary">4.8</span>
 </div>
 </div>
 <h3 className="text-base font-bold text-text-light-primary leading-tight truncate">Summer Floral Midi Dress</h3>
 <p className="text-sm font-bold text-primary">$45.00</p>
 </div>
 </div>
 {/* Product Card 2 */}
 <div className="group flex flex-col gap-2 cursor-pointer">
 <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-dark">
 <img
 alt="White Elegance Dress"
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
 data-alt="White elegant evening dress"
 src="https://lh3.googleusercontent.com/aida-public/AB6AXuATrxNH3nWgMonNTUuHczOEV1WjA-KncL_yKjFwVBDiLRkXe00B1ffV0QKVkvAEFRniiJt---gOoGEUQqIEt_PFfmS2uhZH0Ri47fRShVQYDsepYwy1LQxSNN3RpkKpPgfB72hRUubvlnrAvHWpJV9QDUCWkHWSAbQE9UY4gvoeuM67iTJT_R8WvsD2EOpC57I4H8dbHj1eQRX11FCIoi95ccS497Xlq3OycPfAd2381M9VqKKBTjEHeV830T5-vx1vhaDZIgb6E9w"
 />
 <button className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card-light/70 backdrop-blur-sm text-text-light-primary hover:text-rose-400 transition-all shadow-sm">
 <span className="material-symbols-outlined text-[18px]">favorite</span>
 </button>
 </div>
 <div className="flex flex-col gap-1 p-1">
 <div className="flex items-center justify-between">
 <p className="text-xs font-bold text-text-light-primary">Zara</p>
 <div className="flex items-center gap-0.5">
 <span className="material-symbols-outlined text-[14px] text-amber-400 fill">star</span>
 <span className="text-sm font-bold text-text-light-primary">4.5</span>
 </div>
 </div>
 <h3 className="text-base font-bold text-text-light-primary leading-tight truncate">White Elegance Evening Gown</h3>
 <div className="flex items-center gap-2">
 <p className="text-sm font-bold text-primary">$59.90</p>
 <p className="text-xs text-text-light-secondary line-through font-medium">$89.00</p>
 </div>
 </div>
 </div>
 {/* Product Card 3 */}
 <div className="group flex flex-col gap-2 cursor-pointer">
 <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-dark">
 <img
 alt="Yellow Sundress"
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
 data-alt="Woman in yellow summer dress with hat"
 src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR9WySKOzUX7NJE1UKn5mhR9reDW9VuFfVUmDrNjOxaUA4Pl6vOsyoUyIIBMrFeyFYSeJ04y2Hy4ufpXz_vuQu1rJSQv3RWph497h5HRTxGCD3M7GhnUbH1X3GEdF0H1fcW0Le9oOUvWQNDlXo7v6GyvPyQzo9ERAnXxgr9PKrGcM71y6rVYlSemtDv8Un22svdxlryTsV-bXbT5oQFeZOyt5AfL0CnDdkSX2k7UmqwHu3ZpIXvqMwRbcX9-_MmJZg78so84TKCSU"
 />
 <button className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card-light/70 backdrop-blur-sm text-text-light-primary hover:text-rose-400 transition-all shadow-sm">
 <span className="material-symbols-outlined text-[18px] text-rose-500 fill">favorite</span>
 </button>
 </div>
 <div className="flex flex-col gap-1 p-1">
 <div className="flex items-center justify-between">
 <p className="text-xs font-bold text-text-light-primary">Mango</p>
 <div className="flex items-center gap-0.5">
 <span className="material-symbols-outlined text-[14px] text-amber-400 fill">star</span>
 <span className="text-sm font-bold text-text-light-primary">4.2</span>
 </div>
 </div>
 <h3 className="text-base font-bold text-text-light-primary leading-tight truncate">Yellow Garden Sundress</h3>
 <p className="text-sm font-bold text-primary">$35.00</p>
 </div>
 </div>
 {/* Product Card 4 */}
 <div className="group flex flex-col gap-2 cursor-pointer">
 <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-dark">
 <img
 alt="Denim Mini Dress"
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
 data-alt="Blue denim dress"
 src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvuSRwGyLPnBwoz0e5DUI0e9UfSpJKQ-7NliC3rSpB6_e1GFotamzsxnfEDT6ps5mc2-0sv81JBM2PYYIdbTaGy3ufWEtJHG50YKFD5A66PRd0iw3-9uxYs3rWA80cr9LzHxeDRlpGleMBtHiujSVpZ3C8SOX1tK4VBLIGMq98MKr2bbOJHlu4UY83VmuPyHQ9o2oe0xNi5RVWMGwnowp2_Z23ohholJ5Bogp3ErVISIhY6ycWea2yufltnDfz6vd6m2N_niQ6qkY"
 />
 <button className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card-light/70 backdrop-blur-sm text-text-light-primary hover:text-rose-400 transition-all shadow-sm">
 <span className="material-symbols-outlined text-[18px]">favorite</span>
 </button>
 <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
 New
 </div>
 </div>
 <div className="flex flex-col gap-1 p-1">
 <div className="flex items-center justify-between">
 <p className="text-xs font-bold text-text-light-primary">H&M</p>
 <div className="flex items-center gap-0.5">
 <span className="material-symbols-outlined text-[14px] text-amber-400 fill">star</span>
 <span className="text-sm font-bold text-text-light-primary">4.7</span>
 </div>
 </div>
 <h3 className="text-base font-bold text-text-light-primary leading-tight truncate">Classic Denim Mini</h3>
 <p className="text-sm font-bold text-primary">$29.99</p>
 </div>
 </div>
 {/* Product Card 5 */}
 <div className="group flex flex-col gap-2 cursor-pointer">
 <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-dark">
 <img
 alt="Velvet Night Dress"
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
 data-alt="Black velvet dress"
 src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzm3zvPEoTKGyFvTGbKugzFv3BGFTiPs3XfipVnjcnULWels55DsXyvXjYV6Y7uJ_i7RLPwMSKFm4baPXyOYZsjZx740JYDoY9ZSim5jI-5rPs4xHdi7Jf5fbpMXnJ4l0XPsQwtLFsq8dHuD4sJfyEoLCumJU_dzfG3aUcDmMRgLRpTABMlb5Qo7H8nsp4W0IEgZ8Dr4bbO2Dkg8HandYSLlu9xVuFGID2S9Pff1OZW0KT3S_k6Fu-BTsAhUPThXODg4EZLw4a49s"
 />
 <button className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card-light/70 backdrop-blur-sm text-text-light-primary hover:text-rose-400 transition-all shadow-sm">
 <span className="material-symbols-outlined text-[18px]">favorite</span>
 </button>
 </div>
 <div className="flex flex-col gap-1 p-1">
 <div className="flex items-center justify-between">
 <p className="text-xs font-bold text-text-light-primary">Chanel</p>
 <div className="flex items-center gap-0.5">
 <span className="material-symbols-outlined text-[14px] text-amber-400 fill">star</span>
 <span className="text-sm font-bold text-text-light-primary">5.0</span>
 </div>
 </div>
 <h3 className="text-base font-bold text-text-light-primary leading-tight truncate">Velvet Night Dress</h3>
 <p className="text-sm font-bold text-primary">$120.00</p>
 </div>
 </div>
 {/* Product Card 6 */}
 <div className="group flex flex-col gap-2 cursor-pointer">
 <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-dark">
 <img
 alt="Vintage Polka Dot"
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
 data-alt="Polka dot vintage dress"
 src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0lIcKg-E2RB2cwevC84O5zuu8lcbHG5DaWFRfu0mQvL6BfHL8apbGsDcmYYZziNHfKnmeFzisDssc5ZjKQe6rY4fWjCpWu3Zltio4p-RMI-XItHHz5bGK754d3Hun_z0CAEsmL1i19nIutcPDW1UZxjG-ILwTFVp1JqrLYwYcPNIt3EY25YEd3ctAiORIn1G6Ag31FFU45oGzpI0a1YVogo5QsOgBnrevY1GsvF7_vtGbJtpOheXmxI_KLe3RRG71lJ5QDcgqP4Q"
 />
 <button className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card-light/70 backdrop-blur-sm text-text-light-primary hover:text-rose-400 transition-all shadow-sm">
 <span className="material-symbols-outlined text-[18px]">favorite</span>
 </button>
 </div>
 <div className="flex flex-col gap-1 p-1">
 <div className="flex items-center justify-between">
 <p className="text-xs font-bold text-text-light-primary">Vintage</p>
 <div className="flex items-center gap-0.5">
 <span className="material-symbols-outlined text-[14px] text-amber-400 fill">star</span>
 <span className="text-sm font-bold text-text-light-primary">4.3</span>
 </div>
 </div>
 <h3 className="text-base font-bold text-text-light-primary leading-tight truncate">1950s Polka Dot Dress</h3>
 <div className="flex items-center gap-2">
 <p className="text-sm font-bold text-primary">$42.00</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

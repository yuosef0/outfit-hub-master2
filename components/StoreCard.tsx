import Link from 'next/link';

interface StoreCardProps {
 id: string;
 name: string;
 category: string;
 rating?: number;
 logoUrl?: string;
 address?: string;
}

export function StoreCard({ id, name, category, rating, logoUrl }: StoreCardProps) {
 return (
 <Link
 href={`/stores/${id}`}
 className="flex flex-col w-64 rounded-xl p-4 gap-4 bg-card-light flex-shrink-0 hover:shadow-lg transition-shadow"
 >
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
 {logoUrl ? (
 <img src={logoUrl} alt={name} className="w-full h-full object-cover"/>
 ) : (
 <span className="material-symbols-outlined text-primary text-2xl">store</span>
 )}
 </div>
 <div className="flex flex-col min-w-0 flex-1">
 <h4 className="font-bold text-text-light-primary truncate">
 {name}
 </h4>
 <p className="text-sm text-text-light-secondary truncate">
 {category}
 </p>
 </div>
 </div>
 <div className="flex justify-between items-center">
 {rating && (
 <div className="flex items-center gap-1">
 <span className="material-symbols-outlined text-yellow-400 text-base filled">star</span>
 <p className="text-sm font-semibold text-text-light-secondary">
 {rating.toFixed(1)}
 </p>
 </div>
 )}
 <button className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
 Visit
 </button>
 </div>
 </Link>
 );
}

// Horizontal store card variant
export function StoreCardHorizontal({ id, name, category, rating, logoUrl, address }: StoreCardProps) {
 return (
 <Link
 href={`/stores/${id}`}
 className="flex items-center gap-3 p-3 bg-card-light rounded-xl hover:shadow-md transition-shadow"
 >
 <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
 {logoUrl ? (
 <img src={logoUrl} alt={name} className="w-full h-full object-cover"/>
 ) : (
 <span className="material-symbols-outlined text-primary text-2xl">store</span>
 )}
 </div>
 <div className="flex flex-col min-w-0 flex-1">
 <h4 className="font-bold text-text-light-primary truncate">
 {name}
 </h4>
 <p className="text-sm text-text-light-secondary truncate">
 {category}
 </p>
 {address && (
 <p className="text-xs text-text-light-secondary truncate mt-0.5">
 {address}
 </p>
 )}
 </div>
 <div className="flex flex-col items-end gap-1">
 {rating && (
 <div className="flex items-center gap-1">
 <span className="material-symbols-outlined text-yellow-400 text-sm filled">star</span>
 <p className="text-sm font-semibold text-text-light-secondary">
 {rating.toFixed(1)}
 </p>
 </div>
 )}
 <span className="material-symbols-outlined text-text-light-secondary">
 chevron_right
 </span>
 </div>
 </Link>
 );
}

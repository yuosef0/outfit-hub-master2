import Link from 'next/link';

interface ProductCardProps {
 id: string;
 name: string;
 price: number;
 storeName: string;
 imageUrl?: string;
 category?: string;
 onWishlistToggle?: () => void;
 isInWishlist?: boolean;
}

export function ProductCard({
 id,
 name,
 price,
 storeName,
 imageUrl,
 onWishlistToggle,
 isInWishlist = false,
}: ProductCardProps) {
 return (
 <Link href={`/products/${id}`} className="flex flex-col w-40 flex-shrink-0 gap-2 group">
 <div className="relative w-full aspect-square rounded-xl bg-gradient-to-br from-card-light to-background-light overflow-hidden">
 {imageUrl && (
 <img
 src={imageUrl}
 alt={name}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
 />
 )}
 <button
 onClick={(e) => {
 e.preventDefault();
 onWishlistToggle?.();
 }}
 className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card-light/50 backdrop-blur-sm flex items-center justify-center hover:bg-card-light transition-colors"
 >
 <span
 className={`material-symbols-outlined text-xl ${isInWishlist ? 'filled text-red-500' : 'text-text-light-primary'
 }`}
 >
 favorite
 </span>
 </button>
 </div>
 <p className="text-xs text-text-light-secondary">{storeName}</p>
 <h4 className="font-semibold text-sm text-text-light-primary line-clamp-2">
 {name}
 </h4>
 <p className="font-bold text-text-light-primary">${price.toFixed(2)}</p>
 </Link>
 );
}

// Horizontal product card variant
export function ProductCardHorizontal({
 id,
 name,
 price,
 storeName,
 imageUrl,
 onWishlistToggle,
 isInWishlist = false,
}: ProductCardProps) {
 return (
 <Link
 href={`/products/${id}`}
 className="flex gap-3 p-3 bg-card-light rounded-xl hover:shadow-md transition-shadow"
 >
 <div className="relative w-20 h-24 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex-shrink-0 overflow-hidden">
 {imageUrl && (
 <img src={imageUrl} alt={name} className="w-full h-full object-cover"/>
 )}
 </div>
 <div className="flex flex-col justify-between flex-1 min-w-0">
 <div>
 <p className="text-xs text-text-light-secondary mb-1">
 {storeName}
 </p>
 <h4 className="font-semibold text-sm text-text-light-primary line-clamp-2">
 {name}
 </h4>
 </div>
 <div className="flex items-center justify-between">
 <p className="font-bold text-primary">${price.toFixed(2)}</p>
 <button
 onClick={(e) => {
 e.preventDefault();
 onWishlistToggle?.();
 }}
 className="p-1"
 >
 <span
 className={`material-symbols-outlined text-lg ${isInWishlist ? 'filled text-red-500' : 'text-text-light-secondary'
 }`}
 >
 favorite
 </span>
 </button>
 </div>
 </div>
 </Link>
 );
}

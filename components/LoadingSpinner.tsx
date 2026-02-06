export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
 const sizeClasses = {
 sm: 'w-4 h-4',
 md: 'w-8 h-8',
 lg: 'w-12 h-12',
 };

 return (
 <div className="flex items-center justify-center">
 <div
 className={`${sizeClasses[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
 ></div>
 </div>
 );
}

export function LoadingScreen({ message }: { message?: string }) {
 return (
 <div className="fixed inset-0 bg-background-light flex flex-col items-center justify-center z-50">
 <LoadingSpinner size="lg"/>
 {message && (
 <p className="mt-4 text-text-light-secondary">{message}</p>
 )}
 </div>
 );
}

export function LoadingCard() {
 return (
 <div className="animate-pulse space-y-4">
 <div className="w-full aspect-square bg-card-light rounded-xl"></div>
 <div className="space-y-2">
 <div className="h-4 bg-card-light rounded w-3/4"></div>
 <div className="h-4 bg-card-light rounded w-1/2"></div>
 </div>
 </div>
 );
}

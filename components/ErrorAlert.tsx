'use client';

interface ErrorAlertProps {
 message: string;
 onDismiss?: () => void;
 variant?: 'error' | 'warning' | 'info';
}

export function ErrorAlert({ message, onDismiss, variant = 'error' }: ErrorAlertProps) {
 const variants = {
 error: {
 bg: 'bg-red-900/20',
 border: 'border-red-800',
 text: 'text-red-200',
 icon: 'error',
 },
 warning: {
 bg: 'bg-yellow-900/20',
 border: 'border-yellow-800',
 text: 'text-yellow-200',
 icon: 'warning',
 },
 info: {
 bg: 'bg-blue-900/20',
 border: 'border-blue-800',
 text: 'text-blue-200',
 icon: 'info',
 },
 };

 const style = variants[variant];

 return (
 <div
 className={`flex items-start gap-3 p-4 rounded-lg border ${style.bg} ${style.border} ${style.text}`}
 >
 <span className="material-symbols-outlined text-xl mt-0.5">{style.icon}</span>
 <p className="flex-1 text-sm font-medium">{message}</p>
 {onDismiss && (
 <button onClick={onDismiss} className="flex-shrink-0">
 <span className="material-symbols-outlined text-xl">close</span>
 </button>
 )}
 </div>
 );
}

export function ErrorBanner({ message }: { message: string }) {
 return (
 <div className="w-full bg-red-500 text-white px-4 py-3 flex items-center justify-center gap-2">
 <span className="material-symbols-outlined">error</span>
 <p className="text-sm font-medium">{message}</p>
 </div>
 );
}

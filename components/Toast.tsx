'use client';

import { useEffect } from 'react';

interface ToastProps {
 message: string;
 type?: 'success' | 'error' | 'info';
 onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
 useEffect(() => {
 const timer = setTimeout(() => {
 onClose();
 }, 3000);

 return () => clearTimeout(timer);
 }, [onClose]);

 const bgColor = {
 success: 'bg-green-500',
 error: 'bg-red-500',
 info: 'bg-blue-500'
 }[type];

 const icon = {
 success: 'check_circle',
 error: 'error',
 info: 'info'
 }[type];

 return (
 <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down">
 <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px]`}>
 <span className="material-symbols-outlined text-[24px]">{icon}</span>
 <p className="font-medium text-sm flex-1">{message}</p>
 <button
 onClick={onClose}
 className="text-white/80 hover:text-white transition-colors"
 >
 <span className="material-symbols-outlined text-[20px]">close</span>
 </button>
 </div>
 </div>
 );
}

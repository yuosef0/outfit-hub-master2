'use client';

import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div
                className={`relative bg-card-light rounded-2xl shadow-2xl w-full ${sizeClasses[size]} animate-slide-up max-h-[90vh] flex flex-col`}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-6 pb-4 border-b border-border-light">
                        <h3 className="text-lg font-bold text-text-light-primary">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-card-light transition-colors"
                        >
                            <span className="material-symbols-outlined text-text-light-primary">
                                close
                            </span>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

// Bottom sheet modal variant (mobile-friendly)
export function BottomSheet({ isOpen, onClose, title, children }: Omit<ModalProps, 'size'>) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Bottom Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-card-light rounded-t-3xl shadow-2xl animate-slide-up">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-border-light rounded-full"></div>
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
                        <h3 className="text-lg font-bold text-text-light-primary">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-card-light transition-colors"
                        >
                            <span className="material-symbols-outlined text-text-light-primary">
                                close
                            </span>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

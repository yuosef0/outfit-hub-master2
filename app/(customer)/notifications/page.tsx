'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order_update' | 'promotion' | 'system' | 'general';
    is_read: boolean;
    created_at: string;
    link?: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setNotifications(data || []);

                // Mark unread as read
                const unreadIds = data?.filter((n: Notification) => !n.is_read).map((n: Notification) => n.id) || [];
                if (unreadIds.length > 0) {
                    await supabase
                        .from('notifications')
                        .update({ is_read: true })
                        .in('id', unreadIds);
                }

            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [supabase, router]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'order_update': return 'local_shipping';
            case 'promotion': return 'percent';
            case 'system': return 'settings';
            default: return 'notifications';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'order_update': return 'text-blue-500 bg-blue-100';
            case 'promotion': return 'text-purple-500 bg-purple-100';
            case 'system': return 'text-gray-500 bg-gray-100';
            default: return 'text-amber-500 bg-amber-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-light-secondary">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background-light/95 backdrop-blur-md border-b border-border-light">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-light-primary">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold text-text-light-primary flex-1 text-center pr-10">
                        {t('profile.notifications')}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <main className="p-4 space-y-3">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-text-light-secondary">notifications_off</span>
                        </div>
                        <h2 className="text-xl font-bold text-text-light-primary mb-2">
                            {t('notifications.noNotifications')}
                        </h2>
                        <p className="text-text-light-secondary">
                            {t('notifications.noNotificationsDesc')}
                        </p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`relative bg-card-light rounded-xl p-4 border transition-all ${!notification.is_read ? 'border-primary/30 bg-primary/5' : 'border-border-light'}`}
                        >
                            {!notification.is_read && (
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                            )}

                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(notification.type)}`}>
                                    <span className="material-symbols-outlined text-[24px]">{getIcon(notification.type)}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-semibold text-sm mb-1 ${!notification.is_read ? 'text-primary' : 'text-text-light-primary'}`}>
                                        {notification.title}
                                    </h3>
                                    <p className="text-sm text-text-light-secondary leading-normal mb-2">
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-text-light-secondary/70">
                                        {new Date(notification.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric'
                                        })}
                                    </span>

                                    {notification.link && (
                                        <div className="mt-3">
                                            <Link
                                                href={notification.link}
                                                className="inline-flex items-center text-xs font-bold text-primary hover:underline"
                                            >
                                                {t('common.viewDetails')}
                                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}

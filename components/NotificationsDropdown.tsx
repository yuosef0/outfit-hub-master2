'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';


interface Notification {
    id: string;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
    type: string;
}

export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { language, t } = useLanguage();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch notifications
    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('notifications_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${(async () => (await supabase.auth.getUser()).data.user?.id)()}` // This is tricky in realtime, typically we filter on client or use RLS
                },
                (payload) => {
                    // Refresh on new notification
                    // Since filter with async user id is redundant/complex here, we can just refetch or rely on simple reload interval
                    fetchNotifications();
                }
            )
            .subscribe();

        // Simple polling as backup/simpler realtime
        const interval = setInterval(fetchNotifications, 15000);

        return () => {
            subscription.unsubscribe();
            clearInterval(interval);
        };
    }, []);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (notificationId: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    };

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .is('is_read', false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_product': return 'checkroom';
            case 'price_drop': return 'trending_down';
            case 'new_coupon': return 'local_offer';
            default: return 'notifications';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'new_product': return 'bg-blue-100 text-blue-600';
            case 'price_drop': return 'bg-green-100 text-green-600';
            case 'new_coupon': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-card-light transition-colors text-cream focus:outline-none"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    {unreadCount > 0 ? 'notifications_active' : 'notifications'}
                </span>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background-light animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute top-12 ${language === 'ar' ? '-left-2' : '-right-2'} w-80 md:w-96 bg-background-light rounded-2xl shadow-xl border border-border-light overflow-hidden z-[100] transform origin-top-right transition-all`}>
                    {/* Header */}
                    <div className="p-4 border-b border-border-light flex items-center justify-between bg-card-light">
                        <h3 className="font-bold text-text-light-primary">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary hover:text-primary-dark font-semibold transition-colors"
                            >
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[70vh] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-text-light-secondary">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                جاري التحميل...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-text-light-secondary flex flex-col items-center">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                                <p>لا توجد إشعارات جديدة</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-light">
                                {notifications.map((notification) => (
                                    <Link
                                        key={notification.id}
                                        href={notification.link || '#'}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`block p-4 hover:bg-surface-light transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getColor(notification.type)}`}>
                                                <span className="material-symbols-outlined text-xl">
                                                    {getIcon(notification.type)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold mb-0.5 ${!notification.is_read ? 'text-text-light-primary' : 'text-text-light-primary/80'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-text-light-secondary line-clamp-2 leading-relaxed mb-1.5">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-text-light-secondary/70 font-medium">
                                                    {new Date(notification.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' })}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="shrink-0 self-center">
                                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-border-light bg-card-light text-center">
                        <Link href="/notifications" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors block w-full py-1">
                            عرض كل الإشعارات
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

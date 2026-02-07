'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MallPage() {
 const { t } = useLanguage();
 return (
 <div className="flex min-h-screen items-center justify-center bg-background-light">
 <div className="text-center">
 <h1 className="text-2xl font-bold text-text-light-primary">
 {t('mall.title')}
 </h1>
 <p className="text-text-light-secondary">{t('mall.comingSoon')}</p>
 </div>
 </div>
 );
}

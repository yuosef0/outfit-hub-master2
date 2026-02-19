interface StoreBadgesProps {
    productCount: number;
    isTopWeekly?: boolean;
}

export function StoreBadges({ productCount, isTopWeekly }: StoreBadgesProps) {
    const badges: { label: string; icon: string; className: string }[] = [];

    if (productCount > 30) {
        badges.push({
            label: 'تاجر نشط',
            icon: 'verified',
            className: 'bg-emerald-500 text-white',
        });
    } else if (productCount > 20) {
        badges.push({
            label: 'أفضل عرض',
            icon: 'local_offer',
            className: 'bg-blue-500 text-white',
        });
    }

    if (isTopWeekly) {
        badges.push({
            label: 'الأكثر إضافة هذا الأسبوع',
            icon: 'trending_up',
            className: 'bg-amber-500 text-white',
        });
    }

    if (badges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {badges.map((badge, i) => (
                <span
                    key={i}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                        {badge.icon}
                    </span>
                    {badge.label}
                </span>
            ))}
        </div>
    );
}

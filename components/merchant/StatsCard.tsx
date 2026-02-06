interface StatsCardProps {
 title: string;
 value: string | number;
 change?: string;
 changeType?: 'increase' | 'decrease';
 icon: string;
 iconBg?: string;
}

export default function StatsCard({ title, value, change, changeType, icon, iconBg = 'bg-primary/10' }: StatsCardProps) {
 return (
 <div className="bg-card-light rounded-xl p-6 shadow-card border border-border-light">
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <p className="text-sm text-text-light-secondary mb-1">{title}</p>
 <h3 className="text-2xl font-bold text-text-light-primary">
 {value}
 </h3>
 {change && (
 <p className={`text-sm mt-1 flex items-center gap-1 ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'
 }`}>
 <span className="material-symbols-outlined text-base">
 {changeType === 'increase' ? 'trending_up' : 'trending_down'}
 </span>
 {change}
 </p>
 )}
 </div>
 <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
 <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
 </div>
 </div>
 </div>
 );
}

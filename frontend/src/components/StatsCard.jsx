import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './Card';

const StatsCard = ({ title, value, subtitle, trend, icon: Icon, colorClass, bgClass, borderClass }) => {
  // Extract color name from bgClass (e.g., 'bg-blue-50' -> 'blue')
  const colorName = bgClass?.split('-')[1] || 'blue';
  const defaultBorderClass = `border-t-${colorName}-500`;
  const finalBorderClass = borderClass || defaultBorderClass;

  return (
    <Card hover className={`border-t-4 ${finalBorderClass} relative overflow-hidden`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="w-full">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black text-slate-800">{value ?? 0}</p>
            {trend && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                trend.positive ? 'bg-emerald-50 text-emerald-700' : 
                trend.negative ? 'bg-rose-50 text-rose-700' : 
                'bg-slate-100 text-slate-700'
              }`}>
                {trend.positive ? <TrendingUp size={12} /> : trend.negative ? <TrendingDown size={12} /> : <Minus size={12} />}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm font-medium text-slate-600 mt-1">
              {subtitle}
            </p>
          )}
          {trend?.label && (
            <p className="text-xs font-medium text-slate-400 mt-1">
              {trend.label}
            </p>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 ${bgClass} rounded-2xl flex-shrink-0 ml-4`}>
            <Icon className={colorClass} size={28} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;

import { Inbox } from 'lucide-react';

const EmptyState = ({ 
  title = 'No data available', 
  description = '', 
  icon: Icon = Inbox, 
  className = '',
  action,
  actionLabel 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center px-4 ${className}`}>
      <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
        <Icon className="text-slate-400" size={36} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
      {description && (
        <p className="text-slate-500 max-w-sm text-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action}
          className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
        >
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No data available', description = '', icon: Icon = Inbox, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="text-slate-400" size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      {description && <p className="text-slate-500 max-w-sm">{description}</p>}
    </div>
  );
};

export default EmptyState;
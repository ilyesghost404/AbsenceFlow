import { CheckCircle2, XCircle, Clock, AlertCircle, Shield, UserCheck, UserX } from 'lucide-react';

const StatusBadge = ({ status, type = 'soft', className = '' }) => {
  const getBadgeConfig = (statusString) => {
    const s = (statusString || '').toLowerCase();
    
    // Success types
    if (['approved', 'validated', 'active', 'added', 'healthy', 'enabled', 'completed'].includes(s)) {
      return {
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: CheckCircle2,
        dot: 'bg-emerald-500'
      };
    }
    // Danger types
    if (['rejected', 'disabled', 'error', 'absent', 'missing'].includes(s)) {
      return {
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        icon: XCircle,
        dot: 'bg-rose-500'
      };
    }
    // Warning/Pending types
    if (['pending', 'waiting', 'late', 'unknown', 'checking'].includes(s)) {
      return {
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: Clock,
        dot: 'bg-amber-500'
      };
    }
    // Info/Admin types
    if (['admin', 'administrator'].includes(s)) {
      return {
        color: 'text-violet-700',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        icon: Shield,
        dot: 'bg-violet-500'
      };
    }
    if (['manager'].includes(s)) {
      return {
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: UserCheck,
        dot: 'bg-blue-500'
      };
    }
    if (['employee'].includes(s)) {
      return {
        color: 'text-sky-700',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        icon: UserCheck,
        dot: 'bg-sky-500'
      };
    }
    
    // Default fallback
    return {
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      icon: AlertCircle,
      dot: 'bg-slate-500'
    };
  };

  const config = getBadgeConfig(status);
  const Icon = config.icon;

  if (type === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {status}
      </span>
    );
  }

  if (type === 'outline') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-white ${config.border} ${config.color} ${className}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  }

  // Default 'soft' type
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${className}`}>
      <Icon size={14} />
      {status}
    </span>
  );
};

export default StatusBadge;

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CalendarDays, 
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sunrise,
  Activity,
  UserPlus,
  TrendingUp
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboardStats } from '../services/dashboardService';

import { useNavigate, Link } from 'react-router-dom';

// Timezone-safe local date parser
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    {
      label: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/20',
      iconBg: 'bg-blue-400/20',
    },
    {
      label: 'Present Today',
      value: stats?.presentToday || 0,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/20',
      iconBg: 'bg-emerald-400/20',
    },
    {
      label: 'Absent Today',
      value: stats?.absentToday || 0,
      icon: UserX,
      gradient: 'from-rose-500 to-rose-600',
      shadowColor: 'shadow-rose-500/20',
      iconBg: 'bg-rose-400/20',
    },
    {
      label: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/20',
      iconBg: 'bg-amber-400/20',
    },
    {
      label: 'Upcoming Holidays',
      value: stats?.holidaysThisMonth || 0,
      icon: CalendarDays,
      gradient: 'from-violet-500 to-purple-600',
      shadowColor: 'shadow-violet-500/20',
      iconBg: 'bg-violet-400/20',
    },
  ];

  // Attendance breakdown for the progress bar
  const totalEmp = stats?.totalEmployees || 1;
  const presentPct = Math.round(((stats?.presentToday || 0) / totalEmp) * 100);
  const absentPct = Math.round(((stats?.absentToday || 0) / totalEmp) * 100);
  const latePct = Math.round(((stats?.lateToday || 0) / totalEmp) * 100);
  const onLeavePct = Math.round(((stats?.employeesOnLeaveToday || 0) / totalEmp) * 100);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-1">
              <Sunrise size={16} />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="text-3xl font-bold text-slate-800">{greeting()} 👋</h1>
            <p className="text-slate-500 mt-1">Here's how your company is doing today</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              to="/leave-requests" 
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm"
            >
              <Clock size={16} className="text-amber-500" />
              Review Requests
            </Link>
            <Link 
              to="/attendance" 
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-md text-sm"
            >
              <CalendarDays size={16} />
              Manage Attendance
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick Access Action Bar ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-3 mb-8 animate-slide-up stagger-1">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: 'Add Employee',
              icon: UserPlus,
              iconBg: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
              accent: 'hover:text-emerald-700',
              accentBar: 'bg-emerald-500',
              action: () => navigate('/employees'),
            },
            {
              label: 'Open QR Portal',
              icon: Clock,
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-600',
              accent: 'hover:text-blue-700',
              accentBar: 'bg-blue-500',
              action: () => window.open(window.location.href.split('#')[0] + '#/attendance-verification', 'QRPortalWindow'),
            },
            {
              label: 'Add Department',
              icon: Users,
              iconBg: 'bg-indigo-50',
              iconColor: 'text-indigo-600',
              accent: 'hover:text-indigo-700',
              accentBar: 'bg-indigo-500',
              action: () => navigate('/departments'),
            },
            {
              label: 'Add Holiday',
              icon: CalendarDays,
              iconBg: 'bg-violet-50',
              iconColor: 'text-violet-600',
              accent: 'hover:text-violet-700',
              accentBar: 'bg-violet-500',
              action: () => navigate('/holidays'),
            },
            {
              label: 'Generate Reports',
              icon: TrendingUp,
              iconBg: 'bg-teal-50',
              iconColor: 'text-teal-600',
              accent: 'hover:text-teal-700',
              accentBar: 'bg-teal-500',
              action: () => navigate('/reports'),
            },
          ].map(({ label, icon: Icon, iconBg, iconColor, accent, accentBar, action }) => (
            <button
              key={label}
              onClick={action}
              className={`
                relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl
                text-slate-600 text-sm font-semibold border border-transparent
                transition-all duration-300 group
                ${accent} hover:bg-slate-50 hover:border-slate-100 hover:shadow-sm
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${iconBg} transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105
              `}>
                <Icon size={20} className={iconColor} />
              </div>
              <span className="text-center">{label}</span>
              <span className={`
                absolute bottom-0 left-1/2 -translate-x-1/2
                h-1 w-0 ${accentBar} rounded-t-lg
                transition-all duration-300 group-hover:w-12
              `} />
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`animate-slide-up stagger-${i + 1} bg-gradient-to-br ${card.gradient} rounded-2xl p-5 text-white shadow-lg ${card.shadowColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-3xl font-black tracking-tight">{card.value}</p>
              <p className="text-white/80 text-sm font-medium mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Today's Attendance Summary — Left (3 cols) */}
        <div className="lg:col-span-3 animate-slide-up stagger-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Activity className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Today's Attendance</h2>
                  <p className="text-xs text-slate-400 font-medium">Real-time overview</p>
                </div>
              </div>
              <Link to="/attendance" className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 transition-colors">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="p-6">
              {/* Attendance Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-slate-100">
                  {presentPct > 0 && (
                    <div 
                      className="h-full bg-emerald-500 rounded-l-full transition-all duration-700 ease-out" 
                      style={{ width: `${presentPct}%` }} 
                      title={`Present: ${stats?.presentToday || 0}`}
                    />
                  )}
                  {latePct > 0 && (
                    <div 
                      className="h-full bg-amber-400 transition-all duration-700 ease-out" 
                      style={{ width: `${latePct}%` }} 
                      title={`Late: ${stats?.lateToday || 0}`}
                    />
                  )}
                  {onLeavePct > 0 && (
                    <div 
                      className="h-full bg-violet-400 transition-all duration-700 ease-out" 
                      style={{ width: `${onLeavePct}%` }} 
                      title={`On Leave: ${stats?.employeesOnLeaveToday || 0}`}
                    />
                  )}
                  {absentPct > 0 && (
                    <div 
                      className="h-full bg-rose-400 rounded-r-full transition-all duration-700 ease-out" 
                      style={{ width: `${absentPct}%` }} 
                      title={`Absent: ${stats?.absentToday || 0}`}
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-600 font-medium">Present <span className="font-bold text-slate-800">{stats?.presentToday || 0}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-xs text-slate-600 font-medium">Late <span className="font-bold text-slate-800">{stats?.lateToday || 0}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-400" />
                    <span className="text-xs text-slate-600 font-medium">On Leave <span className="font-bold text-slate-800">{stats?.employeesOnLeaveToday || 0}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="text-xs text-slate-600 font-medium">Absent <span className="font-bold text-slate-800">{stats?.absentToday || 0}</span></span>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-800">{stats?.missingCheckout || 0}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Missing Checkout</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-800">{`${stats?.absenceRate || 0}%`}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Absence Rate</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-800">{stats?.approvedRequests || 0}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Approved</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-800">{stats?.rejectedRequests || 0}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Rejected</p>
                </div>
              </div>

              {/* Next Holiday */}
              {stats?.nextHoliday && (
                <div className="mt-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-xl">
                    <CalendarDays className="text-violet-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-violet-800 truncate">Next Holiday: {stats.nextHoliday.name}</p>
                    <p className="text-xs text-violet-600 font-medium">
                      {parseLocalDate(stats.nextHoliday.holiday_date)?.toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric'
                      }) ?? '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Leave Requests — Right (2 cols) */}
        <div className="lg:col-span-2 animate-slide-up stagger-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Clock className="text-amber-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Recent Requests</h2>
                  <p className="text-xs text-slate-400 font-medium">Latest leave activity</p>
                </div>
              </div>
              <Link to="/leave-requests" className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 transition-colors">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {stats?.recentActivity?.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {stats.recentActivity.slice(0, 6).map((activity, idx) => (
                    <div key={idx} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                            {activity.user_name?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{activity.user_name}</p>
                            <p className="text-xs text-slate-500 truncate">{activity.action}</p>
                          </div>
                        </div>
                        <StatusBadge status={activity.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 pl-12">
                        {new Date(activity.date_time).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                    <Clock className="text-slate-400" size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

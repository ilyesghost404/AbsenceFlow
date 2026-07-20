import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, Clock, CheckCircle2, CalendarDays, Calendar as CalendarIcon, 
  Activity, CalendarOff, Hash, Briefcase, Calendar, ChevronRight
} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboardStats } from '../services/dashboardService';
import { Link } from 'react-router-dom';

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const CircularProgress = ({ value, max, label, colorClass }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const validValue = Math.min(Math.max(0, value), max);
  const strokeDashoffset = circumference - (validValue / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
        <circle 
          cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" 
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" className={`transition-all duration-1000 ease-out ${colorClass}`} 
        />
      </svg>
      <div className="absolute top-10 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-800">{value}</span>
      </div>
      <span className="text-xs font-semibold text-slate-500 mt-2">{label}</span>
    </div>
  );
};

const EmployeeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center py-20 min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  const info = stats.employeeInfo || {};
  const maxVacation = 30; // standard vacation days
  const remainingVacation = stats.remainingVacationDays ?? 30;
  const usedVacation = maxVacation - remainingVacation;

  return (
    <div className="min-h-screen pb-12">
      <div className="mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Welcome back, {info.first_name || 'Employee'}! 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1">Here is your personal absence overview and metrics</p>
        </div>
        <Link 
          to="/leave-requests" 
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          Request Absence
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard title="Remaining Vacation" value={remainingVacation} icon={CalendarDays} colorClass="text-blue-600" bgClass="bg-blue-50" borderClass="border-t-blue-500" />
        <StatsCard title="Pending Requests" value={stats.pendingRequests || 0} icon={Clock} colorClass="text-amber-500" bgClass="bg-amber-50" borderClass="border-t-amber-500" />
        <StatsCard title="Approved Absences" value={stats.approvedRequests || 0} icon={CheckCircle2} colorClass="text-emerald-600" bgClass="bg-emerald-50" borderClass="border-t-emerald-500" />
        <StatsCard title="Total Absences" value={stats.totalAbsences || 0} icon={CalendarOff} colorClass="text-violet-600" bgClass="bg-violet-50" borderClass="border-t-violet-500" />
        <StatsCard 
          title="Next Holiday" 
          value={stats.nextHoliday?.name || 'None'} 
          subtitle={stats.nextHoliday ? parseLocalDate(stats.nextHoliday.holiday_date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          icon={CalendarIcon} 
          colorClass="text-pink-600" 
          bgClass="bg-pink-50" 
          borderClass="border-t-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Balance */}
        <div className="lg:col-span-4 space-y-8">
          {/* Leave Balance Card */}
          <Card className="p-6 shadow-sm border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
              <CalendarDays className="text-emerald-600" size={20} />
              Vacation Balance
            </h3>
            <div className="flex justify-around items-center pt-2">
              <CircularProgress value={usedVacation} max={maxVacation} label="Used Days" colorClass="text-amber-500" />
              <CircularProgress value={remainingVacation} max={maxVacation} label="Remaining" colorClass="text-emerald-500" />
            </div>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-8">
          <Card className="p-6 h-full shadow-sm border-slate-200">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                Recent Activity
              </h3>
              <Link to="/leave-requests" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                View All <ChevronRight size={16} />
              </Link>
            </div>

            {stats.recentAbsences && stats.recentAbsences.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {stats.recentAbsences.map((ab, idx) => {
                  const statusColors = {
                    Pending: 'bg-amber-100 text-amber-600 border-amber-200',
                    Validated: 'bg-emerald-100 text-emerald-600 border-emerald-200',
                    Rejected: 'bg-red-100 text-red-600 border-red-200'
                  };
                  const statusColor = statusColors[ab.status] || 'bg-slate-100 text-slate-600 border-slate-200';
                  
                  return (
                    <div key={ab.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <CalendarDays size={16} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                            {ab.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {new Date(ab.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{ab.type}</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {parseLocalDate(ab.start_date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                          {' '}-{' '} 
                          {parseLocalDate(ab.end_date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <Activity className="text-slate-300" size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-700 mb-1">No Recent Activity</h4>
                <p className="text-slate-500 text-sm max-w-sm">You haven't submitted any absence requests yet. When you do, they will appear here.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

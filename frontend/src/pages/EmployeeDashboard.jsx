import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  CalendarDays, 
  Calendar, 
  Activity,
  CalendarOff
} from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboardStats } from '../services/dashboardService';

// Timezone-safe local date parser
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
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
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  const info = stats.employeeInfo || {};

  return (
    <div className="min-h-screen pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Welcome back, {info.first_name || 'Employee'}!
        </h1>
        <p className="text-slate-500">Your personal absence overview and metrics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Remaining Vacation</p>
              <p className="text-3xl font-bold mt-2 text-teal-600">{stats.remainingVacationDays ?? 30}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-teal-50">
              <CalendarDays className="text-teal-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Pending Requests</p>
              <p className="text-3xl font-bold mt-2 text-amber-500">{stats.pendingRequests || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50">
              <Clock className="text-amber-500" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Approved Absences</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats.approvedRequests || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-green-50">
              <CheckCircle2 className="text-green-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Absence Count</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{stats.totalAbsences || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50">
              <CalendarOff className="text-blue-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Next Holiday</p>
              <p className="text-lg font-bold mt-2 text-slate-800 truncate max-w-[150px]" title={stats.nextHoliday?.name || 'No upcoming holiday'}>
                {stats.nextHoliday?.name || 'None'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.nextHoliday ? parseLocalDate(stats.nextHoliday.holiday_date)?.toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50">
              <Calendar className="text-purple-600" size={28} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Employee Info Card */}
        <Card className="lg:col-span-1 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users className="text-blue-600" size={20} />
            Profile Details
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Matricule</span>
              <span className="text-slate-700 font-medium text-sm">{info.matricule || '—'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Department</span>
              <span className="text-slate-700 font-medium text-sm">{info.department || '—'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Position</span>
              <span className="text-slate-700 font-medium text-sm">{info.position || '—'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Hire Date</span>
              <span className="text-slate-700 font-medium text-sm">
                {info.hire_date ? parseLocalDate(info.hire_date)?.toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <a 
              href="/absences" 
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all text-sm shadow-md"
            >
              Request New Absence
            </a>
          </div>
        </Card>

        {/* Recent Absence History */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Activity className="text-blue-600" size={20} />
            Recent Absences
          </h3>
          {stats.recentAbsences && stats.recentAbsences.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dates</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAbsences.map((ab) => (
                    <tr key={ab.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 text-sm text-slate-700 font-medium">{ab.type}</td>
                      <td className="py-3.5 text-sm text-slate-500">
                        {parseLocalDate(ab.start_date)?.toLocaleDateString()} to {parseLocalDate(ab.end_date)?.toLocaleDateString()}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ab.status === 'Validated' ? 'bg-green-100 text-green-700' :
                          ab.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ab.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 italic text-sm">
              No absence requests filed yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

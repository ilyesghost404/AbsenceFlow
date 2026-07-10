import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  CalendarDays, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Award, 
  Activity,
  CalendarOff
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Legend
} from 'recharts';
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

const ManagerDashboard = () => {
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

  // Process chart data
  const monthlyTrendData = useMemo(() => {
    if (!stats || !stats.monthlyTrend) return [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return stats.monthlyTrend.map(m => ({
      name: `${monthNames[parseInt(m.month) - 1]} ${m.year}`,
      absences: parseInt(m.count)
    }));
  }, [stats]);

  const deptData = useMemo(() => {
    if (!stats || !stats.absencesByDepartment) return [];
    return stats.absencesByDepartment.map(d => ({
      name: d.department,
      absences: parseInt(d.count)
    }));
  }, [stats]);

  const typesData = useMemo(() => {
    if (!stats || !stats.absenceTypes) return [];
    return stats.absenceTypes.map(t => ({
      name: t.type,
      value: parseInt(t.count)
    }));
  }, [stats]);

  const weeklyAttendanceData = useMemo(() => {
    if (!stats || !stats.weeklyAttendance) return [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats = days.map(() => ({ day: '', present: 0, absent: 0 }));
    
    stats.weeklyAttendance.forEach(wa => {
      const dayIndex = parseInt(wa.day_of_week);
      dayStats[dayIndex] = {
        day: days[dayIndex],
        present: parseInt(wa.present),
        absent: (stats?.totalEmployees || 0) - parseInt(wa.present)
      };
    });

    return dayStats.filter(d => d.day); // Only include days with data
  }, [stats]);

  const statusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Approved', value: stats.approvedRequests },
      { name: 'Pending', value: stats.pendingRequests },
      { name: 'Rejected', value: stats.rejectedRequests }
    ];
  }, [stats]);

  const COLORS = ['#2563eb', '#f59e0b', '#ef4444'];
  const DEPT_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Company Statistics</h1>
        <p className="text-slate-500">Overview of attendance, absences, and employee statistics</p>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Employees</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{stats?.totalEmployees || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50">
              <Users className="text-blue-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Present Today</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats?.presentToday || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-green-50">
              <UserCheck className="text-green-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Absent Today</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats?.absentToday || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50">
              <UserX className="text-red-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Pending Requests</p>
              <p className="text-3xl font-bold mt-2 text-amber-600">{stats?.pendingRequests || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50">
              <Clock className="text-amber-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Approved Requests</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats?.approvedRequests || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-green-50">
              <CheckCircle2 className="text-green-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Rejected Requests</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats?.rejectedRequests || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50">
              <XCircle className="text-red-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Holidays This Month</p>
              <p className="text-3xl font-bold mt-2 text-amber-500">{stats?.holidaysThisMonth || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50">
              <CalendarDays className="text-amber-500" size={28} />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Absence Rate</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{stats?.absenceRate || 0}%</p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50">
              <TrendingUp className="text-blue-600" size={28} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={24} />
            Monthly Absence Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="absences" 
                  stroke="#2563eb" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#dbeafe' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24} />
            Absences by Department
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="absences" radius={[10, 10, 0, 0]}>
                  {deptData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={DEPT_COLORS[index % DEPT_COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24} />
            Weekly Attendance
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Bar dataKey="present" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 3: Status Donut + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Award className="text-blue-600" size={24} />
            Requests Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="text-blue-600" size={24} />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {stats?.recentActivity?.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all duration-200 hover:bg-slate-100">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{activity.user_name}</p>
                  <p className="text-sm text-slate-500">{activity.action}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(activity.date_time).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  activity.status === 'Validated' || activity.status === 'Active' || activity.status === 'Added'
                    ? 'bg-green-100 text-green-700'
                    : activity.status === 'Rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hover>
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            Department with Highest Absences
          </h4>
          {stats?.deptWithMostAbsences ? (
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.deptWithMostAbsences.department}</p>
              <p className="text-slate-500 mt-2">{stats.deptWithMostAbsences.count} absences</p>
            </div>
          ) : (
            <p className="text-slate-500">No data available</p>
          )}
        </Card>

        <Card hover>
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="text-blue-600" size={20} />
            Employee with Most Absences
          </h4>
          {stats?.topEmployee ? (
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.topEmployee.name}</p>
              <p className="text-slate-500 mt-2">{stats.topEmployee.count} absences</p>
            </div>
          ) : (
            <p className="text-slate-500">No data available</p>
          )}
        </Card>

        <Card hover>
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            Next Upcoming Holiday
          </h4>
          {stats?.nextHoliday ? (
            <div>
              <p className="text-2xl font-bold text-amber-500">{stats.nextHoliday.name}</p>
              <p className="text-slate-500 mt-2">
                {parseLocalDate(stats.nextHoliday.holiday_date)?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) ?? '—'}
              </p>
            </div>
          ) : (
            <p className="text-slate-500">No upcoming holidays</p>
          )}
        </Card>

        <Card hover>
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            Average Absence Duration
          </h4>
          <p className="text-2xl font-bold text-blue-600">{stats?.avgAbsenceDuration || 0} days</p>
        </Card>

        <Card hover>
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarOff className="text-blue-600" size={20} />
            Total Absences This Month
          </h4>
          <p className="text-2xl font-bold text-red-600">{stats?.absencesThisMonth || 0}</p>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;

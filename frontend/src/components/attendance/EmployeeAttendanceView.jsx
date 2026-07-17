import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  LogIn, LogOut, Clock, CalendarDays, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import Card from '../Card';
import StatsCard from '../StatsCard';
import Table from '../Table';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { checkIn, checkOut } from '../../services/presenceService';
import { getAttendance } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import AttendanceVerifyModal from './AttendanceVerifyModal';

const EmployeeAttendanceView = () => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyType, setVerifyType] = useState('check-in');

  const fetchHistory = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const data = await getAttendance(
        employeeId,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      toast.error("Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCheckIn = () => {
    setVerifyType('check-in');
    setVerifyModalOpen(true);
  };

  const handleCheckOut = () => {
    setVerifyType('check-out');
    setVerifyModalOpen(true);
  };

  const handleVerifySuccess = () => {
    fetchHistory();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = history.find(r => {
    const dStr = r.date.includes('T') ? r.date.split('T')[0] : r.date;
    return dStr === todayStr;
  });

  const getTodayStatus = () => {
    if (!todayRecord) {
      return { label: "Not Checked In", color: "text-slate-500", bg: "bg-slate-100", dotColor: "bg-slate-400" };
    }
    if (todayRecord.check_out) {
      return { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50", dotColor: "bg-emerald-500" };
    }
    return { label: "Checked In", color: "text-blue-700", bg: "bg-blue-50", dotColor: "bg-blue-500" };
  };

  const statusInfo = getTodayStatus();

  // Statistics calculation for the current month
  const stats = {
    present: history.filter(r => r.status === 'Present').length,
    late: history.filter(r => r.status === 'Late').length,
    absent: history.filter(r => r.status === 'Absent').length,
  };

  const formatTime = (time) => {
    if (!time) return "—";
    return time.slice(0, 5);
  };

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const columns = [
    {
      header: 'Date',
      render: (row) => {
        const d = new Date(row.date);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    },
    {
      header: 'Check In',
      render: (row) => (
        row.check_in ? (
          <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-sm">
            {formatTime(row.check_in)}
          </span>
        ) : "—"
      )
    },
    {
      header: 'Check Out',
      render: (row) => (
        row.check_out ? (
          <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-sm">
            {formatTime(row.check_out)}
          </span>
        ) : "—"
      )
    },
    {
      header: 'Status',
      render: (row) => {
        const statusColors = {
          Present: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          Late: 'bg-amber-100 text-amber-700 border-amber-200',
          Absent: 'bg-red-100 text-red-700 border-red-200'
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[row.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'justification',
      render: (row) => {
        if (row.validation_status === 'Pending') {
          return <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 font-semibold">Justification Pending</span>;
        }
        if (row.validation_status === 'Justified') {
          return <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 font-semibold" title={row.justification_reason}>Approved: {row.justification_reason}</span>;
        }
        if (row.validation_status === 'Rejected') {
          return <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 font-semibold">Rejected</span>;
        }
        return <span className="text-slate-400">—</span>;
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Attendance</h1>
          <p className="text-slate-500 font-medium mt-1">Track your check-ins, check-outs, and anomalies</p>
        </div>
      </div>

      {/* Dashboard Actions and Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Today's Action Bubble */}
        <Card noPadding className="lg:col-span-5 flex flex-col justify-between border-slate-200 shadow-sm">
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Clock className="text-blue-600" size={20} />
                Today's Session
              </h3>
              <p className="text-slate-400 text-xs mb-6">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              <div className="flex items-center justify-between mb-6 sm:mb-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${statusInfo.dotColor} ${statusInfo.label === 'Checked In' ? 'animate-pulse' : ''}`} />
                  <span className="font-bold text-slate-800">{statusInfo.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Logged Check-In</p>
                  <p className="font-mono text-slate-800 font-bold">{todayRecord?.check_in ? formatTime(todayRecord.check_in) : '—'}</p>
                </div>
              </div>
            </div>

            <div className="w-full">
              {!todayRecord?.check_in ? (
                <Button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  variant="success"
                  className="w-full justify-center py-3 font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/35"
                  icon={LogIn}
                >
                  {actionLoading ? 'Loading...' : 'Check In'}
                </Button>
              ) : !todayRecord.check_out ? (
                <Button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  variant="primary"
                  className="w-full justify-center py-3 font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/35"
                  icon={LogOut}
                >
                  {actionLoading ? 'Loading...' : 'Check Out'}
                </Button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-500 font-bold rounded-xl border border-slate-200 cursor-default">
                  <CheckCircle2 size={16} />
                  Shift Completed
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Month Stats */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatsCard title="Present Days" value={stats.present} icon={CheckCircle2} colorClass="text-emerald-600" bgClass="bg-emerald-50" borderClass="border-t-emerald-500" />
          <StatsCard title="Late Check-Ins" value={stats.late} icon={Clock} colorClass="text-amber-500" bgClass="bg-amber-50" borderClass="border-t-amber-500" />
          <StatsCard title="Unexcused Absences" value={stats.absent} icon={AlertCircle} colorClass="text-rose-600" bgClass="bg-rose-50" borderClass="border-t-rose-500" />
        </div>
      </div>

      {/* History List */}
      <Card noPadding className="border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">
            History: {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button onClick={goToPreviousMonth} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all"><ChevronLeft size={20}/></button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-bold rounded-lg hover:bg-white hover:shadow-sm text-slate-700 transition-all">Today</button>
            <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all"><ChevronRight size={20}/></button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400 text-sm mt-4 font-semibold">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-semibold">
            No attendance records found for this month.
          </div>
        ) : (
          <Table columns={columns} data={history} className="border-0 rounded-none" />
        )}
      </Card>

      <AttendanceVerifyModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        type={verifyType}
        employeeId={employeeId}
        onSuccess={handleVerifySuccess}
      />
    </div>
  );
};

export default EmployeeAttendanceView;

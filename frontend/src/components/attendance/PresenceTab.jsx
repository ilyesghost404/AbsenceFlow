import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  RefreshCw, Search, Filter, LogIn, LogOut, CheckCircle2, 
  Users, UserCheck, UserX, Clock, AlertCircle, X, TrendingUp
} from 'lucide-react';
import Button from '../../components/Button';
import LoadingSpinner, { SkeletonTable } from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { getTodayAttendance, checkIn, checkOut } from '../../services/presenceService';

const PresenceTab = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTodayAttendance({ page: 1, limit: 1000, search: '' });
      setAttendanceData(data.data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (employeeId) => {
    try {
      await checkIn(employeeId);
      toast.success("Check-in successful!");
      fetchData();
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error(error.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async (employeeId) => {
    try {
      await checkOut(employeeId);
      toast.success("Check-out successful!");
      fetchData();
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error(error.response?.data?.message || "Check-out failed");
    }
  };

  const formatTime = (time) => {
    if (!time) return "—";
    if (typeof time === 'string') {
      return time.slice(0, 5);
    }
    return time;
  };

  const getStatusDisplay = (attendance) => {
    if (!attendance.check_in) {
      return { label: "Not Checked In", color: "text-slate-500", bg: "bg-slate-100", icon: AlertCircle, dotColor: "bg-slate-400" };
    }
    if (attendance.check_out) {
      return { label: attendance.status || "Present", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2, dotColor: "bg-emerald-500" };
    }
    return { label: "Checked In", color: "text-blue-700", bg: "bg-blue-50", icon: Clock, dotColor: "bg-blue-500" };
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.check_in).length;
    const absent = total - present;
    const checkedOut = attendanceData.filter(a => a.check_in && a.check_out).length;
    const checkedIn = attendanceData.filter(a => a.check_in && !a.check_out).length;
    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, checkedOut, checkedIn, attendancePercentage };
  }, [attendanceData]);

  const filteredData = attendanceData.filter(record => {
    const fullName = `${record.first_name} ${record.last_name}`.toLowerCase();
    const matchesSearch = !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      record.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    
    let status = "Not Checked In";
    if (record.check_in) {
      status = record.check_out ? "Checked Out" : "Checked In";
    }
    const matchesFilter = !statusFilter || status.toLowerCase().includes(statusFilter.toLowerCase());
    
    return matchesSearch && matchesFilter;
  });

  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  const getInitials = (firstName, lastName) => {
    const f = firstName ? firstName.charAt(0) : '';
    const l = lastName ? lastName.charAt(0) : '';
    return `${f}${l}`.toUpperCase();
  };

  const statItems = [
    { label: 'Present', value: stats.present, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Absent', value: stats.absent, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Attendance', value: `${stats.attendancePercentage}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Compact Stats Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Date badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl">
            <Clock size={14} className="text-blue-600" />
            <span className="text-blue-700 text-sm font-semibold">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Stats inline */}
          <div className="flex items-center gap-4 flex-1">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${item.bg}`}>
                    <Icon size={14} className={item.color} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800 leading-none">{item.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchData}
            disabled={loading}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by employee name or matricule"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3">
          <Filter className="text-slate-400" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 bg-transparent focus:outline-none text-sm font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="not checked">Not Checked In</option>
            <option value="checked in">Checked In</option>
            <option value="checked out">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState 
            title="No employees found"
            description="Try adjusting your search or filters"
            icon={Users}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Check In</th>
                  <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Check Out</th>
                  <th className="py-4 px-6 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedData.map((record) => {
                  const statusInfo = getStatusDisplay(record);
                  return (
                    <tr key={record.employee_id || record.matricule} className="group hover:bg-blue-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {getInitials(record.first_name, record.last_name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              {record.first_name} {record.last_name}
                            </p>
                            <p className="text-xs text-slate-500">{record.matricule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor} ${!record.check_out && record.check_in ? 'animate-pulse' : ''}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.check_in ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-mono text-sm font-medium">
                            <LogIn size={12} />
                            {formatTime(record.check_in)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.check_out ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-mono text-sm font-medium">
                            <LogOut size={12} />
                            {formatTime(record.check_out)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!record.check_in ? (
                          <button
                            onClick={() => handleCheckIn(record.employee_id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          >
                            <LogIn size={14} />
                            <span className="hidden sm:inline">Check In</span>
                          </button>
                        ) : !record.check_out ? (
                          <button
                            onClick={() => handleCheckOut(record.employee_id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          >
                            <LogOut size={14} />
                            <span className="hidden sm:inline">Check Out</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl cursor-default">
                            <CheckCircle2 size={14} />
                            <span className="hidden sm:inline">Completed</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filteredData.length > 0 && (
            <Pagination 
              page={page} 
              limit={limit} 
              total={filteredData.length} 
              totalPages={Math.ceil(filteredData.length / limit)} 
              onPageChange={(newPage) => setPage(newPage)} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PresenceTab;

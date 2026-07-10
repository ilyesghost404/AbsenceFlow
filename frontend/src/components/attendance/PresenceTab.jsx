import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  RefreshCw, Search, Filter, LogIn, LogOut, CheckCircle2, 
  Users, UserCheck, UserX, Clock, AlertCircle
} from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getTodayAttendance, checkIn, checkOut } from '../../services/presenceService';

const PresenceTab = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTodayAttendance();
      setAttendanceData(data);
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
    if (!time) return "-";
    if (typeof time === 'string') {
      return time.slice(0, 5);
    }
    return time;
  };

  const getStatusDisplay = (attendance) => {
    if (!attendance.check_in) {
      return { label: "Not Checked In", color: "text-slate-500", bg: "bg-slate-100", icon: AlertCircle };
    }
    if (attendance.check_out) {
      return { label: attendance.status || "Present", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 };
    }
    return { label: "Checked In", color: "text-blue-700", bg: "bg-blue-100", icon: Clock };
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

  // Function to get initials from name
  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50">
              <Users className="text-blue-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Present Today</p>
              <p className="text-3xl font-bold text-green-600">{stats.present}</p>
            </div>
          </div>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Absent Today</p>
              <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-50">
              <UserX className="text-red-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Checked In</p>
              <p className="text-3xl font-bold text-blue-600">{stats.checkedIn}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50">
              <UserCheck className="text-blue-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-amber-600">{stats.attendancePercentage}%</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50">
              <CheckCircle2 className="text-amber-600" size={28} />
            </div>
          </div>
        </Card>
      </div>

      {/* Header with date and refresh */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Today's Attendance</h2>
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-blue-700 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          </div>
        <Button
          variant="secondary"
          icon={RefreshCw}
          onClick={fetchData}
          disabled={loading}
          className="!px-5"
        >
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by employee name or matricule"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-4">
          <Filter className="text-slate-400" size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-3 bg-transparent focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="not checked">Not Checked In</option>
            <option value="checked in">Checked In</option>
            <option value="checked out">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="text-slate-500 mt-4">Loading attendance...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-slate-400" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No employees found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => {
                  const status = getStatusDisplay(row);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={row.employee_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {getInitials(row.first_name, row.last_name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {row.first_name} {row.last_name}
                            </p>
                            <p className="text-sm text-slate-500">{row.matricule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-700 text-sm">
                          {formatTime(row.check_in)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-700 text-sm">
                          {formatTime(row.check_out)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold ${status.bg} ${status.color}`}>
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {!row.check_in ? (
                          <Button
                            variant="success"
                            size="sm"
                            icon={LogIn}
                            onClick={() => handleCheckIn(row.employee_id)}
                          >
                            Check In
                          </Button>
                        ) : !row.check_out ? (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={LogOut}
                            onClick={() => handleCheckOut(row.employee_id)}
                          >
                            Check Out
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            icon={CheckCircle2}
                          >
                            Completed
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PresenceTab;

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Users,
  CalendarOff,
  Clock,
  CheckCircle2,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Search,
  Filter
} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Table from '../components/Table';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import {
  getReportStats,
  getMonthlyEvolution,
  getDepartmentStats,
  getAbsenceTypes,
  getEmployeeRanking,
  getDetailedAbsences,
  exportToExcel,
  printReport,
  getAttendanceMatrix
} from '../services/reportService';
import { getEmployees } from '../services/employeeService';
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

// Timezone-safe local date parser
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [detailedData, setDetailedData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    department: '',
    status: '',
    type: '',
    page: 1,
    limit: 10
  });
  const [departments, setDepartments] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [matrixYear, setMatrixYear] = useState(new Date().getFullYear());
  const [matrixMonth, setMatrixMonth] = useState(new Date().getMonth() + 1);
  const [matrixData, setMatrixData] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const fetchMatrixData = useCallback(async () => {
    try {
      setMatrixLoading(true);
      const data = await getAttendanceMatrix(matrixYear, matrixMonth);
      setMatrixData(data);
    } catch (error) {
      console.error('Error fetching attendance matrix:', error);
      toast.error('Failed to load attendance matrix data');
    } finally {
      setMatrixLoading(false);
    }
  }, [matrixYear, matrixMonth]);

  useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  const COLORS = ['#2563eb', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444'];

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Stat filters (no pagination fields)
      const statFilters = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        department: filters.department,
        status: filters.status,
        type: filters.type,
      };

      const [statsRes, monthlyRes, deptRes, typesRes, rankingRes, detailedRes, employeesRes] =
        await Promise.allSettled([
          getReportStats(statFilters),
          getMonthlyEvolution(),
          getDepartmentStats(),
          getAbsenceTypes(),
          getEmployeeRanking(),
          getDetailedAbsences(filters),
          getEmployees({ limit: 1000 }),
        ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      else console.error('Stats failed:', statsRes.reason);

      setMonthlyData(monthlyRes.status === 'fulfilled' ? monthlyRes.value || [] : []);
      setDepartmentData(deptRes.status === 'fulfilled' ? deptRes.value || [] : []);
      setTypeData(typesRes.status === 'fulfilled' ? typesRes.value || [] : []);
      setRankingData(rankingRes.status === 'fulfilled' ? rankingRes.value || [] : []);

      if (detailedRes.status === 'fulfilled') {
        setDetailedData(detailedRes.value.data || []);
        setPagination({
          page: detailedRes.value.page || 1,
          limit: detailedRes.value.limit || 10,
          total: detailedRes.value.total || 0,
          totalPages: detailedRes.value.totalPages || 0
        });
      } else {
        console.error('Detailed absences failed:', detailedRes.reason);
      }

      if (employeesRes.status === 'fulfilled') {
        const employeesData = Array.isArray(employeesRes.value)
          ? employeesRes.value
          : employeesRes.value.data || employeesRes.value.employees || [];
        const deptList = [...new Set(employeesData.map(e => e.department).filter(Boolean))];
        setDepartments(deptList);
      }

      // Show error only if all critical calls failed
      const criticalFailed = [statsRes, detailedRes].every(r => r.status === 'rejected');
      if (criticalFailed) {
        toast.error('Failed to load reports data. Please check your connection.');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleExportExcel = () => {
    setIsExportModalOpen(true);
  };

  const confirmExport = async () => {
    try {
      setExporting(true);
      await exportToExcel({ year: selectedYear, month: selectedMonth });
      toast.success('Excel exported successfully');
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    try {
      await printReport();
    } catch (error) {
      console.error('Error printing:', error);
      toast.error('Failed to print');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'validated':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }

  };
  const formatMatrixDay = (day) => {
    const date = new Date(matrixYear, matrixMonth - 1, day);

    return {
      number: String(day).padStart(2, '0'),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };
  return (
    <div className="min-h-screen print:bg-white print:p-0">
      <div className="mb-8 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Reports</h1>
            <p className="text-slate-500">HR Analytics and Reporting Center</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              icon={FileText}
              onClick={() => toast.info('PDF export coming soon')}
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              onClick={handleExportExcel}
              loading={exporting}
            >
              Export Excel
            </Button>
            <Button
              variant="secondary"
              icon={Printer}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              icon={RefreshCw}
              onClick={fetchAllData}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-500 mt-4">Loading reports...</p>
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <StatsCard
                title="Total Absences"
                value={stats.totalAbsences}
                icon={CalendarOff}
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
              />
              <StatsCard
                title="Absence Rate"
                value={`${stats.absenceRate}%`}
                icon={TrendingUp}
                colorClass="text-purple-600"
                bgClass="bg-purple-50"
              />
              <StatsCard
                title="Pending Requests"
                value={stats.pendingRequests}
                icon={Clock}
                colorClass="text-amber-600"
                bgClass="bg-amber-50"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                Monthly Absence Evolution
              </h3>
              <div className="h-72">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
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
                        dataKey="count"
                        stroke="#2563eb"
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#dbeafe' }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={24} />
                Absences by Department
              </h3>
              <div className="h-72">
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
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
                        {departmentData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChart className="text-blue-600" size={24} />
                Absence Types Distribution
              </h3>
              <div className="h-72">
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
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
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                Top Absent Employees
              </h3>
              <div className="space-y-4">
                {rankingData.length > 0 ? (
                  rankingData.slice(0, 5).map((emp, index) => (
                    <div
                      key={emp.matricule}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{emp.name}</p>
                          <p className="text-sm text-slate-500">{emp.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-800">{emp.count}</p>
                        <p className="text-xs text-slate-500">absences</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="print:hidden mb-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Filter size={20} className="text-blue-600" />
                Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Validated">Validated</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">All Types</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Training">Training</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden shadow-sm border border-slate-100 rounded-3xl mb-8">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Monthly Attendance Matrix</h3>
                <p className="text-sm text-slate-500 mt-1">HR payroll attendance sheet matrix view</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={matrixYear}
                  onChange={(e) => setMatrixYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold bg-white text-slate-700"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <select
                  value={matrixMonth}
                  onChange={(e) => setMatrixMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold bg-white text-slate-700"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
              {matrixLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <LoadingSpinner size="md" />
                  <p className="text-slate-500 mt-4 text-sm font-semibold">Loading matrix data...</p>
                </div>
              ) : matrixData && matrixData.matrix ? (
                <table className="min-w-full border-collapse bg-white text-left text-sm text-slate-500">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="sticky left-0 top-0 z-30 bg-slate-50 px-6 py-4 font-bold text-slate-800 border-r border-b border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[200px]">
                        Employee
                      </th>
                      <th scope="col" className="sticky top-0 z-20 bg-slate-50 px-4 py-4 font-bold text-slate-800 border-b border-slate-200">
                        Matricule
                      </th>
                      <th scope="col" className="sticky top-0 z-20 bg-slate-50 px-4 py-4 font-bold text-slate-800 border-b border-slate-200">
                        Department
                      </th>
                      {Array.from({ length: matrixData.totalDays }, (_, i) => i + 1).map((day) => {
                        const date = new Date(matrixYear, matrixMonth - 1, day);
                        const dayName = date.toLocaleString('en-US', { weekday: 'short' });
                        const formattedDate = `${String(day).padStart(2, '0')} ${dayName}`;

                        return (
                          <th
                            key={day}
                            scope="col"
                            className="sticky top-0 z-20 bg-slate-50 px-2 py-4 font-bold text-slate-700 text-center border-b border-slate-200 min-w-[70px] text-xs whitespace-nowrap"
                          >
                            {formattedDate}
                          </th>
                        );
                      })}
                      <th scope="col" className="sticky right-0 top-0 z-30 bg-slate-100 px-4 py-4 font-bold text-slate-800 border-l border-b border-slate-200 text-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[120px]">
                        Total Worked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {matrixData.matrix.map((row) => (
                      <tr key={row.employee_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="sticky left-0 bg-white z-10 px-6 py-4 font-bold text-slate-800 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[200px] hover:bg-slate-50">
                          {row.name}
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium">
                          {row.matricule}
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-medium truncate max-w-[150px]" title={row.department}>
                          {row.department}
                        </td>
                        {row.dailyStatus.map((dayStatus, idx) => {
                          let cellBg = '';
                          let cellText = 'text-slate-700';

                          if (dayStatus.status === 'weekend') {
                            cellBg = 'bg-slate-100/60';
                            cellText = 'text-slate-400';
                          } else if (dayStatus.status === 'holiday') {
                            cellBg = 'bg-slate-100';
                            cellText = 'text-slate-500 font-bold';
                          } else if (dayStatus.status === 'absent') {
                            cellBg = 'bg-red-50';
                            cellText = 'text-red-600 font-bold';
                          } else if (dayStatus.status === 'present') {
                            cellText = 'text-emerald-600 font-bold text-base';
                          } else if (dayStatus.status === 'future') {
                            cellBg = 'bg-slate-50/30';
                            cellText = 'text-transparent select-none';
                          }

                          return (
                            <td
                              key={idx}
                              className={`px-1 py-4 text-center border-r border-slate-100 ${cellBg} ${cellText}`}
                              title={dayStatus.hoverText}
                            >
                              {dayStatus.label}
                            </td>
                          );
                        })}
                        <td className="sticky right-0 bg-slate-50/90 z-10 px-4 py-4 font-bold text-slate-800 text-center border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[120px] hover:bg-slate-100">
                          {row.totalWorkedDays}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20 text-center text-slate-400 font-semibold">
                  No attendance matrix data loaded.
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500 select-none">
              <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold text-base">✓</span> Present / Late</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-bold">A</span> Unexcused Absence</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-bold">V</span> Vacation</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-bold">S</span> Sick Leave</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-bold">T</span> Training</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-bold">O</span> Other Leave</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-bold">J</span> Justified Absence</span>
              <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-slate-100 rounded inline-block text-center text-slate-500 pt-0.5 font-bold">H</span> Holiday</span>
              <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-slate-100/60 rounded inline-block text-center text-slate-400 pt-0.5">W</span> Weekend</span>
            </div>
          </Card>
        </>
      )}

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          body {
            background: white !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Report"
      >
        <div className="space-y-6">
          <p className="text-slate-600">
            Select the month you want to export data for.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setIsExportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmExport}
              loading={exporting}
            >
              Export
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;

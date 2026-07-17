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
import api from '../services/api';
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
  const [formFilters, setFormFilters] = useState({
    department_id: '',
    timePeriod: 'this_month',
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    start_date: '',
    end_date: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    department_id: '',
    start_date: '',
    end_date: '',
    month: ''
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(response.data.data || response.data);
      } catch (error) {
        console.error('Failed to load departments', error);
      }
    };
    loadDepartments();
  }, []);
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

  const applyFilters = useCallback(() => {
    let start_date = formFilters.start_date;
    let end_date = formFilters.end_date;
    let month = '';

    const today = new Date();
    if (formFilters.timePeriod === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start_date = firstDay.toISOString().split('T')[0];
      end_date = lastDay.toISOString().split('T')[0];
    } else if (formFilters.timePeriod === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      start_date = firstDay.toISOString().split('T')[0];
      end_date = lastDay.toISOString().split('T')[0];
    } else if (formFilters.timePeriod === 'specific_month' && formFilters.month) {
      const [year, monthStr] = formFilters.month.split('-');
      const firstDay = new Date(year, monthStr - 1, 1);
      const lastDay = new Date(year, monthStr, 0);
      start_date = firstDay.toISOString().split('T')[0];
      end_date = lastDay.toISOString().split('T')[0];
      month = formFilters.month;
    }

    setActiveFilters({
      department_id: formFilters.department_id,
      start_date,
      end_date,
      month,
      page: 1,
      limit: 10
    });
  }, [formFilters]);

  // Initial fetch on mount
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = useCallback(async () => {
    // Only fetch if activeFilters is populated (not initial mount empty)
    if (!activeFilters.start_date && !activeFilters.month && !activeFilters.end_date) return;
    try {
      setLoading(true);

      const [statsRes, monthlyRes, deptRes, typesRes, rankingRes, detailedRes] =
        await Promise.allSettled([
          getReportStats(activeFilters),
          getMonthlyEvolution(activeFilters),
          getDepartmentStats(activeFilters),
          getAbsenceTypes(activeFilters),
          getEmployeeRanking(activeFilters),
          getDetailedAbsences(activeFilters),
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
  }, [activeFilters]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleFilterChange = (key, value) => {
    setFormFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFormFilters({
      department_id: '',
      timePeriod: 'this_month',
      month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      start_date: '',
      end_date: ''
    });
    setTimeout(() => {
      applyFilters(); // will apply the default values again
    }, 0);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await exportToExcel(activeFilters);
      toast.success('Excel exported successfully');
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
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    value={formFilters.department_id}
                    onChange={(e) => handleFilterChange('department_id', e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>

                  <select
                    value={formFilters.timePeriod}
                    onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="specific_month">Specific Month</option>
                    <option value="custom">Custom Date Range</option>
                  </select>

                  {formFilters.timePeriod === 'specific_month' && (
                    <input
                      type="month"
                      value={formFilters.month}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                      className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    />
                  )}

                  {formFilters.timePeriod === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={formFilters.start_date}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        title="Start Date"
                      />
                      <input
                        type="date"
                        value={formFilters.end_date}
                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        title="End Date"
                      />
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <Button variant="secondary" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                  <Button onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
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


    </div>
  );
};

export default Reports;

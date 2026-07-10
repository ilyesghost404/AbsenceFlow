import { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';
import { 
  Edit2, Trash2, CheckCircle2, Info, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, CalendarDays, Search,
  CalendarCheck, Users, CalendarOff, Plus, XCircle
} from 'lucide-react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import { 
  getAbsences, 
  getAbsencesByDate, 
  createAbsence,
  updateAbsence, 
  deleteAbsence, 
  validateAbsence,
  rejectAbsence
} from '../../services/absenceService';
import { getEmployees } from '../../services/employeeService';

// Timezone-safe local date parser
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Custom CSS for react-calendar
const calendarStyles = `
  .react-calendar {
    width: 100% !important;
    border: none !important;
    font-family: inherit !important;
  }

  .react-calendar__navigation {
    display: none !important;
  }

  .react-calendar__viewContainer {
    margin-top: 0 !important;
  }

  .react-calendar__month-view__weekdays {
    margin-bottom: 1rem !important;
  }

  .react-calendar__month-view__weekdays__weekday {
    text-align: center !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    color: #6b7280 !important;
    text-transform: uppercase !important;
    padding: 0.5rem 0 !important;
    abbr {
      text-decoration: none !important;
    }
  }

  .react-calendar__month-view__days__day {
    padding: 0.5rem !important;
    height: 3rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  @media (min-width: 640px) {
    .react-calendar__month-view__days__day {
      padding: 0.75rem !important;
      height: 4rem !important;
    }
  }

  .react-calendar__month-view__days__day--neighboringMonth {
    opacity: 0.3 !important;
  }

  .react-calendar__tile {
    border-radius: 0.75rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 2.75rem !important;
    transition: all 0.2s ease-in-out !important;
  }

  @media (min-width: 640px) {
    .react-calendar__tile {
      height: 3.5rem !important;
    }
  }

  .react-calendar__tile:hover {
    transform: scale(1.05) !important;
  }

  .react-calendar__tile--active {
    background: none !important;
    color: inherit !important;
  }
`;

const AbsencesTab = () => {
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateAbsences, setSelectedDateAbsences] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    type: 'Vacation',
    start_date: '',
    end_date: '',
    reason: '',
  });
  // Filters for absence history
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [absencesData, employeesData] = await Promise.all([
        getAbsences(),
        getEmployees(),
      ]);
      setAbsences(absencesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchAbsencesForDate = async (date) => {
    try {
      const formattedDate = formatDate(date);
      const data = await getAbsencesByDate(formattedDate);
      setSelectedDateAbsences(data);
    } catch (err) {
      console.error('Error fetching absences for date:', err);
      toast.error('Failed to load absences for selected date');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchAbsencesForDate(selectedDate);
  }, [absences]); // Update selected date absences whenever absences changes

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = parseLocalDate(dateStr);
    return date ? date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) : '—';
  };

  const hasAbsenceOnDate = (date) => {
    const dateStr = formatDate(date);
    return absences.some(
      (absence) => dateStr >= absence.start_date && dateStr <= absence.end_date
    );
  };

  const getDominantStatusForDate = (date) => {
    const dateStr = formatDate(date);
    const dateAbsences = absences.filter(
      (absence) => dateStr >= absence.start_date && dateStr <= absence.end_date
    );
    if (dateAbsences.some(a => a.status === 'Rejected')) return 'Rejected';
    if (dateAbsences.some(a => a.status === 'Pending')) return 'Pending';
    if (dateAbsences.some(a => a.status === 'Validated')) return 'Validated';
    return null;
  };

  const handleAdd = () => {
    setEditingAbsence(null);
    setFormData({
      employee_id: '',
      type: 'Vacation',
      start_date: '',
      end_date: '',
      reason: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (absence) => {
    setEditingAbsence(absence);
    setFormData({
      employee_id: absence.employee_id,
      type: absence.type,
      start_date: absence.start_date,
      end_date: absence.end_date,
      reason: absence.reason || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this absence?')) {
      try {
        await deleteAbsence(id);
        fetchData();
        toast.success('Absence deleted successfully');
      } catch (error) {
        console.error('Error deleting absence:', error);
        toast.error('Failed to delete absence');
      }
    }
  };

  const handleValidate = async (id) => {
    try {
      await validateAbsence(id);
      fetchData();
      toast.success('Absence validated successfully');
    } catch (error) {
      console.error('Error validating absence:', error);
      toast.error(error?.response?.data?.message || 'Failed to validate absence');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectAbsence(id);
      fetchData();
      toast.success('Absence rejected');
    } catch (error) {
      console.error('Error rejecting absence:', error);
      toast.error(error?.response?.data?.message || 'Failed to reject absence');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAbsence) {
        const result = await updateAbsence(editingAbsence.id, formData);
        toast.success('Absence updated successfully');
        if (result?.message) toast(result.message, { icon: 'ℹ️' });
      } else {
        const result = await createAbsence(formData);
        toast.success('Absence created successfully');
        if (result?.message) toast(result.message, { icon: 'ℹ️' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving absence:', error);
      toast.error(error?.response?.data?.message || 'Failed to save absence');
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchAbsencesForDate(date);
  };

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    return parts.map(p => p.charAt(0)).join('').toUpperCase();
  };

  // Statistics
  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthAbsences = absences.filter(a => {
      const start = parseLocalDate(a.start_date);
      const end = parseLocalDate(a.end_date);
      if (!start || !end) return false;
      return (
        (start.getMonth() === currentMonth && start.getFullYear() === currentYear) ||
        (end.getMonth() === currentMonth && end.getFullYear() === currentYear) ||
        (start < new Date(currentYear, currentMonth, 1) && end > new Date(currentYear, currentMonth + 1, 0))
      );
    });
    
    return {
      total: thisMonthAbsences.length,
      validated: thisMonthAbsences.filter(a => a.status === 'Validated').length,
      pending: thisMonthAbsences.filter(a => a.status === 'Pending').length,
      rejected: thisMonthAbsences.filter(a => a.status === 'Rejected').length,
    };
  }, [absences]);

  // Filtered absence history
  const filteredAbsences = useMemo(() => {
    return absences.filter(a => {
      const matchesSearch = !searchTerm || 
        (a.employee_name && a.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.reason && a.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      
      const matchesType = typeFilter === 'All' || a.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [absences, searchTerm, statusFilter, typeFilter]);

  const statusDotColors = {
    Validated: '#22c55e',
    Pending: '#eab308',
    Rejected: '#ef4444',
  };

  const tileContent = ({ date }) => {
    if (hasAbsenceOnDate(date)) {
      const status = getDominantStatusForDate(date);
      return (
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: statusDotColors[status] }}
        />
      );
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const isSelected = formatDate(date) === formatDate(selectedDate);
    const isToday = formatDate(date) === formatDate(new Date());
    const status = getDominantStatusForDate(date);
    
    let classes = 'relative transition-all duration-200 rounded-xl flex items-center justify-center';
    
    if (isSelected) {
      classes += ' bg-blue-600 text-white font-semibold shadow-lg scale-105';
    } else if (status) {
      if (status === 'Validated') classes += ' bg-green-100 text-green-800 hover:bg-green-200';
      else if (status === 'Pending') classes += ' bg-amber-100 text-amber-800 hover:bg-amber-200';
      else if (status === 'Rejected') classes += ' bg-red-100 text-red-800 hover:bg-red-200';
    } else if (isToday) {
      classes += ' bg-blue-100 text-blue-600 font-semibold border-2 border-blue-500';
    } else {
      classes += ' hover:bg-slate-100 text-slate-700';
    }
    
    return classes;
  };

  const columns = [
    {
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
            {getInitials(row.employee_name)}
          </div>
          <div className="font-semibold text-slate-800">{row.employee_name}</div>
        </div>
      ),
    },
    { header: 'Type', key: 'type' },
    {
      header: 'Start Date',
      render: (row) => formatDisplayDate(row.start_date),
    },
    {
      header: 'End Date',
      render: (row) => formatDisplayDate(row.end_date),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
          row.status === 'Validated' ? 'bg-green-100 text-green-700' :
          row.status === 'Rejected' ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Reason',
      cellClassName: 'whitespace-normal max-w-xs',
      render: (row) => row.reason || '—',
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'Pending' && (
            <>
              <button
                title="Approve"
                aria-label="Approve absence"
                onClick={() => handleValidate(row.id)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm border border-green-100"
              >
                <CheckCircle2 size={16} strokeWidth={2.5} />
              </button>
              <button
                title="Reject"
                aria-label="Reject absence"
                onClick={() => handleReject(row.id)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm border border-red-100"
              >
                <XCircle size={16} strokeWidth={2.5} />
              </button>
            </>
          )}
          <button
            title="Edit"
            aria-label="Edit absence"
            onClick={() => handleEdit(row)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm border border-blue-100"
          >
            <Edit2 size={16} strokeWidth={2.5} />
          </button>
          <button
            title="Delete"
            aria-label="Delete absence"
            onClick={() => handleDelete(row.id)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm border border-red-100"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card hover>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Total This Month</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-blue-50 shrink-0">
              <CalendarCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Validated</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.validated}</p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-green-50 shrink-0">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Pending</p>
              <p className="text-2xl md:text-3xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-amber-50 shrink-0">
              <Info className="text-amber-600" size={24} />
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Rejected</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-red-50 shrink-0">
              <CalendarOff className="text-red-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-500 mt-4">Loading absences...</p>
        </div>
      ) : error ? (
        <Card>
          <ErrorMessage message={error} />
          <Button onClick={fetchData} className="mt-4">Try Again</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Calendar + Daily Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card noPadding>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" icon={ChevronLeft} onClick={goToPreviousMonth} className="!p-2" />
                    <Button variant="secondary" icon={CalendarDays} onClick={goToToday}>Today</Button>
                    <Button variant="secondary" icon={ChevronRight} onClick={goToNextMonth} className="!p-2" />
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    activeStartDate={currentDate}
                    onActiveStartDateChange={({ activeStartDate }) => setCurrentDate(activeStartDate)}
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                    className="w-full !border-none"
                    showNavigation={false}
                    minDetail="month"
                    maxDetail="month"
                  />
                </div>
              </Card>
            </div>

            {/* Selected Date Panel */}
            <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
              <Card>
                <div className="text-center mb-6 pb-6 border-b border-slate-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <CalendarIcon className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </h3>
                  <p className="text-base text-slate-600">
                    {selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Absences
                </h4>
                {selectedDateAbsences.length === 0 ? (
                  <EmptyState
                    title="No absences"
                    description="No employees are absent on this day"
                    icon={CalendarIcon}
                    className="py-8"
                  />
                ) : (
                  <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                    {selectedDateAbsences.map((absence) => (
                      <div key={absence.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all duration-200 hover:bg-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                            {getInitials(absence.employee_name)}
                          </div>
                          <div className="font-semibold text-slate-900 truncate">{absence.employee_name}</div>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 text-sm">
                          {absence.matricule && (
                            <div className="text-slate-500">
                              <span className="font-medium">Matricule:</span> {absence.matricule}
                            </div>
                          )}
                          {absence.department && (
                            <div className="text-slate-500">
                              <span className="font-medium">Department:</span> {absence.department}
                            </div>
                          )}
                          <div className="text-slate-700">
                            <span className="font-medium">Type:</span> {absence.type}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                            absence.status === 'Validated' ? 'bg-green-100 text-green-700' :
                            absence.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {absence.status}
                          </span>
                        </div>

                        {absence.reason && (
                          <div className="text-sm text-slate-600 mt-3 p-3 bg-white rounded-lg border border-slate-100 italic">
                            "{absence.reason}"
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                          {absence.status === 'Pending' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                icon={CheckCircle2}
                                onClick={() => handleValidate(absence.id)}
                              >
                                Validate
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                icon={XCircle}
                                onClick={() => handleReject(absence.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleEdit(absence)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Absence History */}
          <Card noPadding>
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-800 shrink-0">Absence History</h3>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto lg:justify-end">
                  <Button icon={Plus} onClick={handleAdd}>Add Absence</Button>
                  <div className="relative flex-1 sm:min-w-[200px] lg:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search absences..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:min-w-[140px]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Validated">Validated</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:min-w-[140px]"
                  >
                    <option value="All">All Types</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Training">Training</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className={filteredAbsences.length === 0 ? 'p-6' : undefined}>
              <Table
                columns={columns}
                data={filteredAbsences}
                emptyMessage="No absences found"
                className="border-0 rounded-none"
              />
            </div>
          </Card>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAbsence ? "Edit Absence" : "Add Absence"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Employee</label>
            <select
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Vacation">Vacation</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Training">Training</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AbsencesTab;

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  Trash2, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Plus,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Search,
  Filter,
  Info,
  Clock
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import EmployeeHolidaysView from '../components/holidays/EmployeeHolidaysView';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../services/holidayService';
import { useAuth } from '../context/AuthContext';

// Timezone-safe local date parser
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const TYPE_COLORS = {
  National: { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#2563eb' },
  Religious: { bg: 'bg-green-100', text: 'text-green-700', hex: '#16a34a' },
  Company: { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#9333ea' },
  Optional: { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#d97706' },
};

const getDaysInMonth = (year, month) => {
  const days = [];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false
    });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return days;
};

const Holidays = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Calendar States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // List View States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [deletingHoliday, setDeletingHoliday] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    holiday_date: '',
    type: 'National',
    recurring: false,
    description: '',
    color: 'blue'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHolidays({ limit: 1000 });
      setHolidays(data.data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      setError('Failed to load holidays');
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getHolidayForDate = (date) => {
    const dateStr = formatDate(date);
    return holidays.find(h => h.holiday_date === dateStr);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (isEmployee) return;
    
    const holiday = getHolidayForDate(date);
    if (holiday) {
      handleEdit(holiday);
    } else {
      handleAdd(date);
    }
  };

  const handleAdd = (date = new Date()) => {
    setEditingHoliday(null);
    setFormData({
      name: '',
      holiday_date: formatDate(date),
      type: 'National',
      recurring: false,
      description: '',
      color: 'blue'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      holiday_date: holiday.holiday_date,
      type: holiday.type || 'National',
      recurring: holiday.recurring || false,
      description: holiday.description || '',
      color: holiday.color || 'blue'
    });
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (holiday, e) => {
    if (e) e.stopPropagation();
    setDeletingHoliday(holiday);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHoliday) return;
    try {
      setIsDeleting(true);
      await deleteHoliday(deletingHoliday.id);
      toast.success('Holiday deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingHoliday(null);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Failed to delete holiday');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.holiday_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      if (editingHoliday) {
        await updateHoliday(editingHoliday.id, formData);
        toast.success('Holiday updated successfully');
      } else {
        await createHoliday(formData);
        toast.success('Holiday created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast.error(error?.response?.data?.message || 'Failed to save holiday');
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar Controls
  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Stats Logic
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth();

    const holidaysThisYear = holidays.filter(h => parseLocalDate(h.holiday_date)?.getFullYear() === thisYear);
    const holidaysThisMonth = holidaysThisYear.filter(h => parseLocalDate(h.holiday_date)?.getMonth() === thisMonth);
    
    const upcoming = holidays
      .filter(h => parseLocalDate(h.holiday_date) >= today)
      .sort((a, b) => parseLocalDate(a.holiday_date) - parseLocalDate(b.holiday_date));
      
    const nextHoliday = upcoming[0] || null;
    let daysUntilNext = null;
    if (nextHoliday) {
      const nextDate = parseLocalDate(nextHoliday.holiday_date);
      const diffTime = Math.abs(nextDate - today);
      daysUntilNext = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      total: holidays.length,
      thisYear: holidaysThisYear.length,
      thisMonth: holidaysThisMonth.length,
      nextHoliday,
      daysUntilNext
    };
  }, [holidays]);

  // Calendar data
  const days = useMemo(() => {
    return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const holidaysByDate = useMemo(() => {
    const map = {};
    holidays.forEach(h => {
      const dateStr = h.holiday_date;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(h);
    });
    return map;
  }, [holidays]);

  // Filtered List Logic
  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const matchesSearch = !searchTerm || h.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || (h.type || 'National') === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [holidays, searchTerm, typeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen py-10 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Loading holidays..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-8">
        <Card className="p-8 max-w-2xl mx-auto text-center">
          <ErrorMessage message={error} />
          <Button onClick={fetchData} className="mt-6">Try Again</Button>
        </Card>
      </div>
    );
  }

  if (isEmployee) {
    return <EmployeeHolidaysView holidays={holidays} stats={stats} />;
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <div className="mb-6 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Holidays</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage public, religious, and company holidays</p>
        </div>
        <Button icon={Plus} onClick={() => handleAdd(new Date())} className="shadow-lg hover:shadow-blue-500/25 transition-all">
          Add Holiday
        </Button>
      </div>

      {/* Full-Width Calendar — matching EmployeeHolidaysView style */}
      <div className="animate-slide-up stagger-1">
        <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={goToPreviousMonth} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all"><ChevronLeft size={20}/></button>
              <button onClick={goToToday} className="px-3 py-1.5 text-sm font-bold rounded-lg hover:bg-white hover:shadow-sm text-slate-700 transition-all">Today</button>
              <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-3 text-center text-xs font-bold tracking-wider text-slate-500 uppercase">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-[1px]">
                {days.map((dayObj, i) => {
                  const { date, isCurrentMonth } = dayObj;
                  const dateStr = formatDate(date);
                  const dayHolidays = holidaysByDate[dateStr] || [];
                  const isToday = formatDate(new Date()) === dateStr;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <div 
                      key={i}
                      onClick={() => handleDateChange(date)}
                      className={`
                        min-h-[120px] p-2 transition-all group cursor-pointer
                        ${!isCurrentMonth ? 'bg-slate-50/80 text-slate-400' : 'bg-white'}
                        ${isWeekend && isCurrentMonth ? 'bg-slate-50/30' : ''}
                        ${dayHolidays.length > 0 ? 'hover:bg-blue-50/30' : 'hover:bg-slate-50'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`
                          flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold transition-all
                          ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : ''}
                          ${!isToday && isCurrentMonth ? 'text-slate-700 group-hover:text-blue-600' : ''}
                        `}>
                          {date.getDate()}
                        </span>
                        {/* Show edit icon on hover for manager on holiday days */}
                        {dayHolidays.length > 0 && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(dayHolidays[0]); }}
                              className="p-1 rounded-md hover:bg-blue-100 text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteRequest(dayHolidays[0], e); }}
                              className="p-1 rounded-md hover:bg-rose-100 text-rose-500"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 mt-1">
                        {dayHolidays.map((h, idx) => {
                          const typeStyle = TYPE_COLORS[h.type || 'National'] || TYPE_COLORS.National;
                          return (
                            <div 
                              key={idx}
                              className={`px-2 py-1.5 rounded-lg text-xs font-semibold truncate shadow-sm transition-transform hover:scale-[1.02] ${typeStyle.bg} ${typeStyle.text}`}
                              title={h.name}
                            >
                              {h.name}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div> National
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div> Religious
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300"></div> Company
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div> Optional
            </div>
            <p className="text-xs text-slate-400 italic ml-4">Click any date to add or edit a holiday</p>
          </div>
        </Card>
      </div>

      {/* Holiday List Below Calendar */}
      <div className="mt-8 animate-slide-up stagger-3">
        <Card noPadding className="border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-800">All Holidays</h3>
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search holidays..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer font-medium text-slate-700"
                >
                  <option value="All">All Types</option>
                  <option value="National">National</option>
                  <option value="Religious">Religious</option>
                  <option value="Company">Company</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            {filteredHolidays.length === 0 ? (
              <div className="py-20">
                <EmptyState 
                  title="No holidays found" 
                  description={searchTerm || typeFilter !== 'All' ? "Try adjusting your filters" : "You haven't added any holidays yet. Click 'Add Holiday' or select a date on the calendar."}
                  icon={CalendarDays} 
                />
              </div>
            ) : (
              <>
                <Table 
                  columns={[
                    {
                      header: 'Holiday Name',
                      render: (row) => (
                        <div>
                          <div className="font-semibold text-slate-800">{row.name}</div>
                          {row.description && <div className="text-xs text-slate-500 truncate max-w-[200px]" title={row.description}>{row.description}</div>}
                        </div>
                      )
                    },
                    {
                      header: 'Date',
                      render: (row) => {
                        const d = parseLocalDate(row.holiday_date);
                        return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                      }
                    },
                    {
                      header: 'Day',
                      render: (row) => {
                        const d = parseLocalDate(row.holiday_date);
                        return d ? d.toLocaleDateString('en-US', { weekday: 'long' }) : '—';
                      }
                    },
                    {
                      header: 'Type',
                      render: (row) => {
                        const t = row.type || 'National';
                        const style = TYPE_COLORS[t] || TYPE_COLORS.National;
                        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>{t}</span>;
                      }
                    },
                    {
                      header: 'Recurring',
                      render: (row) => row.recurring ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Yearly</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )
                    },
                    {
                      header: 'Actions',
                      render: (row) => (
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleEdit(row)} icon={Edit2} className="!p-2 text-blue-600 hover:bg-blue-50 hover:border-blue-200" title="Edit" />
                          <Button variant="secondary" size="sm" onClick={(e) => handleDeleteRequest(row, e)} icon={Trash2} className="!p-2 text-red-600 hover:bg-red-50 hover:border-red-200" title="Delete" />
                        </div>
                      )
                    }
                  ]} 
                  data={filteredHolidays.slice((page - 1) * limit, page * limit)} 
                  className="border-0 rounded-none"
                />
                <Pagination 
                  page={page} 
                  limit={limit} 
                  total={filteredHolidays.length} 
                  totalPages={Math.ceil(filteredHolidays.length / limit)} 
                  onPageChange={(newPage) => setPage(newPage)} 
                />
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingHoliday ? "Edit Holiday" : "Add New Holiday"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Warning for duplicates */}
          {!editingHoliday && formData.holiday_date && getHolidayForDate(new Date(formData.holiday_date)) && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium flex items-start gap-2">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <p>Warning: A holiday already exists on this date. Saving will replace it or cause an error depending on rules.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Holiday Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. New Year's Day"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.holiday_date}
                onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="National">National</option>
                <option value="Religious">Religious</option>
                <option value="Company">Company</option>
                <option value="Optional">Optional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              placeholder="Add notes about this holiday..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={formData.recurring}
              onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-bold text-slate-800 text-sm">Recurring Holiday</p>
              <p className="text-xs text-slate-500">This holiday happens on the same date every year</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            {editingHoliday && (
              <Button type="button" variant="danger" onClick={() => handleDeleteRequest(editingHoliday)} disabled={isSaving} className="mr-auto">
                Delete
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingHoliday ? 'Save Changes' : 'Create Holiday')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <p className="text-slate-800 text-lg font-bold mb-2">Delete Holiday?</p>
          <p className="text-slate-600 mb-6 px-4">
            Are you sure you want to delete <strong>{deletingHoliday?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1" disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="flex-1" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Holidays;

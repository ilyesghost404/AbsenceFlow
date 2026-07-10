import { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';
import { 
  Trash2, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Plus,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import { getHolidays, createHoliday, deleteHoliday } from '../services/holidayService';

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
    padding: 0.75rem !important;
    height: 4rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .react-calendar__month-view__days__day--neighboringMonth {
    opacity: 0.3 !important;
  }

  .react-calendar__tile {
    border-radius: 0.75rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 3.5rem !important;
    transition: all 0.2s ease-in-out !important;
  }

  .react-calendar__tile:hover {
    transform: scale(1.05) !important;
  }

  .react-calendar__tile--active {
    background: none !important;
    color: inherit !important;
  }
`;

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidayName, setHolidayName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHolidays();
      setHolidays(data);
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

  const isHoliday = (date) => {
    return getHolidayForDate(date) !== undefined;
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setHolidayName('');
  };

  const handleAddHoliday = async () => {
    if (!holidayName.trim()) {
      toast.error('Please enter a holiday name');
      return;
    }

    try {
      setIsAdding(true);
      await createHoliday({
        holiday_date: formatDate(selectedDate),
        name: holidayName.trim()
      });
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-500" />
          <span>Holiday added successfully</span>
        </div>
      );
      setHolidayName('');
      fetchData();
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Failed to add holiday');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteHoliday = async () => {
    try {
      setIsDeleting(true);
      const holiday = getHolidayForDate(selectedDate);
      await deleteHoliday(holiday.id);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-500" />
          <span>Holiday deleted successfully</span>
        </div>
      );
      setShowDeleteConfirm(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Failed to delete holiday');
    } finally {
      setIsDeleting(false);
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

  const sortedUpcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays
      .filter(h => { const d = parseLocalDate(h.holiday_date); return d && d >= today; })
      .sort((a, b) => parseLocalDate(a.holiday_date) - parseLocalDate(b.holiday_date));
  }, [holidays]);

  const selectedHoliday = getHolidayForDate(selectedDate);

  const tileContent = ({ date }) => {
    const holiday = getHolidayForDate(date);
    if (holiday) {
      return (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
        </div>
      );
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const holiday = getHolidayForDate(date);
    const isSelectedDate = formatDate(date) === formatDate(selectedDate);
    const isTodayDate = isToday(date);
    const isWeekendDate = isWeekend(date);
    
    let classes = 'relative transition-all duration-200 rounded-xl flex items-center justify-center';
    
    if (isSelectedDate) {
      classes += ' bg-blue-600 text-white font-semibold shadow-lg scale-105';
    } else if (holiday) {
      classes += ' bg-blue-100 text-blue-700 font-medium hover:bg-blue-200';
    } else if (isTodayDate) {
      classes += ' bg-blue-50 text-blue-700 font-semibold border-2 border-blue-500';
    } else if (isWeekendDate) {
      classes += ' text-slate-400';
    } else {
      classes += ' hover:bg-slate-100 text-slate-700';
    }
    
    return classes;
  };

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array(7).fill(0).map((_, i) => (
              <div key={`weekday-${i}`} className="h-6 bg-gray-200 rounded"></div>
            ))}
            {Array(35).fill(0).map((_, i) => (
              <div key={`day-${i}`} className="h-14 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Card className="p-6">
          <div className="h-40 bg-gray-200 rounded-xl"></div>
        </Card>
        <Card className="p-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Public Holidays</h1>
        <p className="text-slate-500">Manage company-wide public holidays</p>
      </div>

      {loading ? (
        renderLoadingSkeleton()
      ) : error ? (
        <Card className="p-8">
          <ErrorMessage message={error} />
          <Button onClick={fetchData} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {/* Custom Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    icon={ChevronLeft}
                    onClick={goToPreviousMonth}
                    className="!p-2"
                  />
                  <Button
                    variant="secondary"
                    icon={CalendarDays}
                    onClick={goToToday}
                  >
                    Today
                  </Button>
                  <Button
                    variant="secondary"
                    icon={ChevronRight}
                    onClick={goToNextMonth}
                    className="!p-2"
                  />
                </div>
              </div>

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
            </Card>

            {/* Upcoming Holidays List */}
            {holidays.length > 0 && (
              <Card className="p-8 mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Upcoming Holidays</h3>
                  <span className="text-sm text-slate-500">
                    {sortedUpcomingHolidays.length} holiday{!sortedUpcomingHolidays.length || sortedUpcomingHolidays.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {sortedUpcomingHolidays.slice(0, 10).map(holiday => (
                    <div
                      key={holiday.id}
                      className="p-6 bg-gradient-to-r from-slate-50 to-white border border-slate-100 rounded-2xl cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-300 group"
                      onClick={() => handleDateChange(new Date(holiday.holiday_date))}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <CalendarIcon size={24} className="text-blue-700" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">
                              {holiday.name}
                            </div>
                            <div className="text-slate-500 mt-1">
                              {new Date(holiday.holiday_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateChange(new Date(holiday.holiday_date));
                            setShowDeleteConfirm(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="p-8">
              {selectedHoliday ? (
                <div className="space-y-8">
                  {/* Holiday Details */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CalendarIcon className="text-white" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedHoliday.name}</h3>
                    <p className="text-lg text-slate-600">
                      {new Date(selectedHoliday.holiday_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <div className="pt-4 border-t border-slate-100">
                    <Button
                      variant="danger"
                      icon={Trash2}
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Holiday'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Date Display */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                      <CalendarIcon className="text-blue-700" size={40} />
                    </div>
                    <p className="text-sm text-slate-500 mb-1">Selected Date</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>

                  {/* Holiday Name Input */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Holiday Name</label>
                    <input
                      type="text"
                      placeholder="e.g., New Year's Day"
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddHoliday()}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                    />
                  </div>

                  {/* Add Button */}
                  <Button
                    icon={Plus}
                    onClick={handleAddHoliday}
                    className="w-full"
                    disabled={!holidayName.trim() || isAdding}
                  >
                    {isAdding ? 'Adding...' : 'Add Holiday'}
                  </Button>
                </div>
              )}
            </Card>

            {/* Empty State */}
            {holidays.length === 0 && (
              <Card className="p-8">
                <EmptyState
                  title="No public holidays added yet"
                  description="Select a date on the calendar and add your first holiday to get started"
                  icon={CalendarIcon}
                />
              </Card>
            )}

            {/* Quick Stats */}
            {holidays.length > 0 && (
              <Card className="p-6">
                <h4 className="font-bold text-slate-800 mb-4">This Year</h4>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-700">
                    {holidays.filter(h => { const d = parseLocalDate(h.holiday_date); return d && d.getFullYear() === new Date().getFullYear(); }).length}
                  </div>
                  <p className="text-slate-500 mt-1">Holidays</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        title="Delete Holiday"
        size="sm"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete <strong>{selectedHoliday?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteHoliday}
            className="flex-1"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Holidays;

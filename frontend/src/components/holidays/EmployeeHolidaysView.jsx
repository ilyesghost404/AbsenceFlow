import { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, CalendarDays, Calendar as CalendarIcon, Filter, Clock, Info, CheckCircle2 
} from 'lucide-react';
import Card from '../Card';
import StatsCard from '../StatsCard';
import Modal from '../Modal';

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
  
  // Prev month padded days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  // Next month padded days
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return days;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EmployeeHolidaysView = ({ holidays, stats }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

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

  const handleDayClick = (date) => {
    const dateStr = formatDate(date);
    const dayHolidays = holidaysByDate[dateStr] || [];
    if (dayHolidays.length > 0) {
      setSelectedDate(date);
      setIsModalOpen(true);
    }
  };

  const selectedHolidays = selectedDate ? (holidaysByDate[formatDate(selectedDate)] || []) : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Holidays</h1>
          <p className="text-slate-500 font-medium mt-1">View public, religious, and company holidays</p>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total" 
          value={stats?.total ?? 0} 
          icon={CalendarDays} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
          borderClass="border-t-blue-500" 
        />
        <StatsCard 
          title="This Year" 
          value={stats?.thisYear ?? 0} 
          icon={CalendarIcon} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
          borderClass="border-t-emerald-500" 
        />
        <StatsCard 
          title="This Month" 
          value={stats?.thisMonth ?? 0} 
          icon={Filter} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
          borderClass="border-t-amber-500" 
        />
        <StatsCard 
          title="Next Holiday" 
          value={stats?.nextHoliday ? stats.nextHoliday.name : 'None scheduled'} 
          subtitle={stats?.nextHoliday ? `In ${stats.daysUntilNext} day${stats.daysUntilNext !== 1 ? 's' : ''}` : ''}
          icon={Clock} 
          colorClass="text-purple-700" 
          bgClass="bg-purple-50" 
          borderClass="border-t-purple-500" 
        />
      </div>

      {/* Calendar Grid Container */}
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
                    onClick={() => handleDayClick(date)}
                    className={`
                      min-h-[120px] p-2 transition-all group
                      ${!isCurrentMonth ? 'bg-slate-50/80 text-slate-400' : 'bg-white'}
                      ${isWeekend && isCurrentMonth ? 'bg-slate-50/30' : ''}
                      ${dayHolidays.length > 0 ? 'cursor-pointer hover:bg-blue-50/30' : ''}
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

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-center gap-6">
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
        </div>
      </Card>

      {/* Holiday Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Holiday Details'}
      >
        <div className="space-y-4">
          {selectedHolidays.map((h, i) => {
            const typeStyle = TYPE_COLORS[h.type || 'National'] || TYPE_COLORS.National;
            return (
              <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
                {/* Accent border left */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1.5" 
                  style={{ backgroundColor: typeStyle.hex }} 
                />
                
                <div className="flex items-start justify-between pl-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{h.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${typeStyle.bg} ${typeStyle.text}`}>
                        {h.type || 'National'}
                      </span>
                      {h.recurring && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={12} /> Recurring
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {h.description && (
                  <div className="pt-3 border-t border-slate-50 pl-2">
                    <p className="text-sm text-slate-600 flex items-start gap-2">
                      <Info className="shrink-0 text-slate-400 mt-0.5" size={16} />
                      {h.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeHolidaysView;

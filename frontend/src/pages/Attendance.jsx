import { useState } from 'react';
import { CalendarCheck, Clock, CalendarOff } from 'lucide-react';
import PresenceTab from '../components/attendance/PresenceTab';
import AbsencesTab from '../components/attendance/AbsencesTab';

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('presence');

  const tabs = [
    { id: 'presence', label: 'Attendance', icon: Clock },
    { id: 'absences', label: 'History', icon: CalendarOff },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <CalendarCheck className="text-blue-600" size={28} />
          <h1 className="text-3xl font-bold text-slate-800">Attendance Management</h1>
        </div>
        <p className="text-slate-500 text-sm">Monitor and manage employee attendance and absences</p>
      </div>

      {/* Modern Underline Tabs */}
      <div className="animate-fade-in stagger-1">
        <div className="border-b border-slate-200">
          <div className="flex gap-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-6 py-3.5 flex items-center gap-2 font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                  {/* Active indicator */}
                  <div className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-600 opacity-100' 
                      : 'bg-transparent opacity-0'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-slide-up">
        {activeTab === 'presence' && <PresenceTab />}
        {activeTab === 'absences' && <AbsencesTab />}
      </div>
    </div>
  );
};

export default Attendance;

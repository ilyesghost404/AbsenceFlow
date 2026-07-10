import { useState } from 'react';
import { CalendarCheck, Clock, CalendarOff } from 'lucide-react';
import PresenceTab from '../components/attendance/PresenceTab';
import AbsencesTab from '../components/attendance/AbsencesTab';

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('presence');

  const tabs = [
    { id: 'presence', label: 'Presence', icon: Clock },
    { id: 'absences', label: 'Absences', icon: CalendarOff },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <CalendarCheck className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-slate-800">Attendance Management</h1>
        </div>
        <p className="text-slate-500">Monitor and manage employee attendance and absences</p>
      </div>

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none px-6 py-3 flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'presence' && <PresenceTab />}
        {activeTab === 'absences' && <AbsencesTab />}
      </div>
    </div>
  );
};

export default Attendance;

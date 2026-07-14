import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Edit2, Search, Filter, X, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner, { SkeletonTable } from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { getAnomalies, validateAnomaly } from '../../services/attendanceService';

const AbsencesTab = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    validation_status: 'Pending',
    justification_reason: '',
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredAnomalies = anomalies.filter(a => {
    const matchesSearch = !searchTerm || 
      (a.first_name && a.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.last_name && a.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.matricule && a.matricule.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const valStatus = a.validation_status || 'Pending';
    const matchesStatus = statusFilter === 'All' || valStatus === statusFilter;
    const matchesType = typeFilter === 'All' || a.anomaly_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnomalies();
      setAnomalies(data);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
      setError('Failed to load system absences/anomalies.');
      toast.error('Failed to load absences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenValidate = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setFormData({
      validation_status: anomaly.validation_status || 'Pending',
      justification_reason: anomaly.justification_reason || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAnomaly) return;
    try {
      await validateAnomaly(selectedAnomaly.id, formData);
      toast.success('Validation saved successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving validation:', err);
      toast.error(err?.response?.data?.message || 'Failed to save validation');
    }
  };

  const getInitials = (firstName, lastName) => {
    const f = firstName ? firstName.charAt(0) : '';
    const l = lastName ? lastName.charAt(0) : '';
    return `${f}${l}`.toUpperCase();
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Absent': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🔴' };
      case 'Late': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🟠' };
      case 'Missing Check-out': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: '⚪' };
    }
  };

  const getValidationStyle = (status) => {
    switch (status) {
      case 'Justified': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Unjustified': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'All' || typeFilter !== 'All';

  if (loading) {
    return <SkeletonTable rows={6} columns={6} />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <ErrorMessage message={error} />
        <Button onClick={fetchData} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Toggle Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-800">System Absences & Anomalies</h3>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Filter size={14} />
            Filters
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center animate-fade-in">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Validation</option>
            <option value="Pending">Pending</option>
            <option value="Justified">Justified</option>
            <option value="Unjustified">Unjustified</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Missing Check-out">Missing Check-out</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('All'); setTypeFilter('All'); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <X size={14} /> Clear all
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400 font-medium">
            {filteredAnomalies.length} record{filteredAnomalies.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Table */}
      {filteredAnomalies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState
            title="No system absences or anomalies found"
            description={hasActiveFilters ? "Try adjusting your filters" : "All clear — no anomalies detected"}
            icon={CheckCircle2}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">System Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Validation</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAnomalies.map((row, idx) => {
                  const typeStyle = getTypeStyle(row.anomaly_type);
                  const valStatus = row.validation_status || 'Pending';
                  return (
                    <tr key={row.id || idx} className="group hover:bg-blue-50/20 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {getInitials(row.first_name, row.last_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{row.first_name} {row.last_name}</div>
                            <div className="text-xs text-slate-500">{row.matricule}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                          <span className="text-[10px]">{typeStyle.icon}</span>
                          {row.anomaly_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold w-max border ${getValidationStyle(valStatus)}`}>
                            {valStatus}
                          </span>
                          {row.justification_reason && (
                            <span className="text-[11px] text-slate-500 max-w-[150px] truncate" title={row.justification_reason}>
                              {row.justification_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenValidate(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-xl transition-all"
                        >
                          {valStatus !== 'Pending' ? (
                            <><Edit2 size={13} /> Edit</>
                          ) : (
                            <><CheckCircle2 size={13} /> Validate</>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Validate Absence/Anomaly"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
            <p className="text-sm font-medium text-slate-700">
              Employee: {selectedAnomaly?.first_name} {selectedAnomaly?.last_name}
            </p>
            <p className="text-sm text-slate-500">
              Date: {selectedAnomaly ? new Date(selectedAnomaly.date).toLocaleDateString() : ''}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Anomaly Type: <span className="font-semibold text-slate-700">{selectedAnomaly?.anomaly_type}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Validation Status</label>
            <select
              required
              value={formData.validation_status}
              onChange={(e) => setFormData({ ...formData, validation_status: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Justified">Justified</option>
              <option value="Unjustified">Unjustified</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Justification / Notes</label>
            <textarea
              value={formData.justification_reason}
              onChange={(e) => setFormData({ ...formData, justification_reason: e.target.value })}
              rows={4}
              placeholder="E.g., Medical certificate provided, technical error with check-in system..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Validation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AbsencesTab;

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, Edit2, Trash2, CalendarDays, Clock, FileText, 
  CheckCircle2, XCircle, Search, Umbrella, Activity, BookOpen
} from 'lucide-react';
import Card from '../Card';
import Button from '../Button';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import { getAbsences, createAbsence, updateAbsence, deleteAbsence } from '../../services/absenceService';

const TYPE_CONFIG = {
  'Vacation': { icon: Umbrella, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-600' },
  'Sick Leave': { icon: Activity, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-600' },
  'Training': { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', ring: 'ring-purple-600' },
  'Other': { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', ring: 'ring-slate-600' },
};

const STATUS_CONFIG = {
  'Pending': { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  'Validated': { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  'Rejected': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const EmployeeLeaveRequestsView = () => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'Vacation',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const absencesData = await getAbsences();
      setAbsences(absencesData);
    } catch (error) {
      console.error('Error fetching absences:', error);
      toast.error('Failed to load your leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingAbsence(null);
    setFormData({
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
      type: absence.type,
      start_date: parseLocalDate(absence.start_date).toISOString().split('T')[0],
      end_date: parseLocalDate(absence.end_date).toISOString().split('T')[0],
      reason: absence.reason || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to withdraw this request?')) {
      try {
        await deleteAbsence(id);
        fetchData();
        toast.success('Request withdrawn successfully');
      } catch (error) {
        console.error('Error deleting request:', error);
        toast.error('Failed to withdraw request');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date cannot be before start date');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingAbsence) {
        await updateAbsence(editingAbsence.id, formData);
        toast.success('Request updated successfully');
      } else {
        await createAbsence(formData);
        toast.success('Leave request submitted successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving request:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAbsences = absences.filter(a => {
    const matchesSearch = !searchTerm || (a.reason && a.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Requests</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and track your leave applications</p>
        </div>
        <Button icon={Plus} onClick={handleAdd} className="shadow-lg hover:shadow-blue-500/25 transition-all px-6 py-2.5">
          New Request
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 mb-8 shadow-sm border-slate-200">
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
          <div className="relative flex-1 w-full sm:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 bg-slate-50/50 focus:bg-white"
            />
          </div>
          
          <div className="flex w-full sm:w-auto gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:w-40 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50/50 focus:bg-white cursor-pointer appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Validated">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 sm:w-40 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50/50 focus:bg-white cursor-pointer appearance-none"
            >
              <option value="All">All Types</option>
              <option value="Vacation">Vacation</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Training">Training</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-500 animate-pulse font-medium">Loading your requests...</p>
        </div>
      ) : filteredAbsences.length === 0 ? (
        <Card className="py-20 shadow-sm border-slate-200">
          <EmptyState 
            title="No requests found" 
            description={searchTerm || statusFilter !== 'All' || typeFilter !== 'All' ? "Try adjusting your filters to see more results." : "You haven't submitted any leave requests yet."}
            icon={FileText} 
          />
          {(!searchTerm && statusFilter === 'All' && typeFilter === 'All') && (
            <div className="flex justify-center mt-6">
              <Button onClick={handleAdd} icon={Plus}>Create your first request</Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAbsences.map(request => {
            const typeConf = TYPE_CONFIG[request.type] || TYPE_CONFIG['Other'];
            const statConf = STATUS_CONFIG[request.status] || STATUS_CONFIG['Pending'];
            const TypeIcon = typeConf.icon;
            const StatIcon = statConf.icon;

            const start = parseLocalDate(request.start_date);
            const end = parseLocalDate(request.end_date);
            
            // Calculate duration purely for visual representation
            const diffTime = Math.abs(end - start);
            const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return (
              <Card key={request.id} className="p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow group border-slate-200 flex flex-col">
                <div className={`p-5 border-b flex items-start justify-between ${typeConf.bg} ${typeConf.border}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${typeConf.color}`}>
                      <TypeIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{request.type}</h3>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                        {durationDays} Day{durationDays !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${statConf.bg} ${statConf.color} ${statConf.border}`}>
                    <StatIcon size={14} strokeWidth={3} />
                    {request.status === 'Validated' ? 'Approved' : request.status}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <CalendarDays className="text-slate-400" size={18} />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Range</span>
                      <span className="text-sm font-bold text-slate-700 mt-0.5">
                        {start?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="text-slate-300 mx-2">→</span>
                        {end?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reason</span>
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {request.reason || <span className="italic text-slate-400">No reason provided</span>}
                    </p>
                  </div>

                  {request.status === 'Pending' && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(request)}
                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Request"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(request.id)}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                        title="Withdraw Request"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                  {request.status !== 'Pending' && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Submitted on {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enhanced Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingAbsence ? 'Edit Request' : 'New Leave Request'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Leave Type <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {['Vacation', 'Sick Leave', 'Training', 'Other'].map(type => {
                const conf = TYPE_CONFIG[type];
                const Icon = conf.icon;
                const isSelected = formData.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? `${conf.border} ${conf.bg} ${conf.ring} ring-1 shadow-sm` 
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={24} className={`mb-2 ${isSelected ? conf.color : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>{type}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Start Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">End Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                min={formData.start_date}
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Reason / Comments</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="Provide a brief reason for your absence..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting} className="px-8 py-2.5 shadow-md">
              {isSubmitting ? 'Saving...' : (editingAbsence ? 'Update Request' : 'Submit Request')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeLeaveRequestsView;

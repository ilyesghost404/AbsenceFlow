import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock, Search, X, Calendar, AlertCircle, FileText } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { getAbsences, createAbsence, updateAbsence, deleteAbsence, validateAbsence, rejectAbsence } from '../services/absenceService';
import { getEmployees } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';
import EmployeeLeaveRequestsView from '../components/leave/EmployeeLeaveRequestsView';

const LeaveRequests = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    type: 'Vacation',
    start_date: '',
    end_date: '',
    reason: '',
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const filteredAbsences = absences.filter(a => {
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    
    return matchesStatus && matchesType;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const absencesData = await getAbsences({ page, limit, search: searchTerm });
      setAbsences(absencesData.data);
      setTotal(absencesData.total);
      setTotalPages(absencesData.totalPages);
      // Only fetch employees for admin/manager — employees don't need the list
      if (!isEmployee) {
        const employeesData = await getEmployees({ limit: 1000 });
        setEmployees(employeesData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // reset to page 1 on search
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      status: absence.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await deleteAbsence(id);
        fetchData();
        toast.success('Request deleted successfully');
      } catch (error) {
        console.error('Error deleting request:', error);
        toast.error('Failed to delete request');
      }
    }
  };

  const handleValidate = async (id) => {
    try {
      await validateAbsence(id);
      fetchData();
      toast.success('Request validated successfully');
    } catch (error) {
      console.error('Error validating request:', error);
      toast.error(error?.response?.data?.message || 'Failed to validate request');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectAbsence(id);
      fetchData();
      toast.success('Request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error?.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAbsence) {
        const result = await updateAbsence(editingAbsence.id, formData);
        toast.success('Request updated successfully');
        if (result?.message) toast(result.message, { icon: 'ℹ️' });
      } else {
        const result = await createAbsence(formData);
        toast.success('Request created successfully');
        if (result?.message) toast(result.message, { icon: 'ℹ️' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving request:', error);
      toast.error(error?.response?.data?.message || 'Failed to save request');
    }
  };

  if (isEmployee) {
    return <EmployeeLeaveRequestsView />;
  }

  const pendingCount = absences.filter(a => a.status === 'Pending').length;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Validated': return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'border-l-emerald-500', icon: CheckCircle2 };
      case 'Rejected': return { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', accent: 'border-l-rose-500', icon: XCircle };
      default: return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'border-l-amber-500', icon: Clock };
    }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'Vacation': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'Sick Leave': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      case 'Training': return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const getDaysDiff = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const statusTabs = ['All', 'Pending', 'Validated', 'Rejected'];

  // Skeleton cards for loading
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded-full w-1/3" />
              <div className="h-3 bg-slate-100 rounded-full w-1/4" />
            </div>
            <div className="h-6 bg-slate-200 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Leave Requests</h1>
            <p className="text-slate-500 text-sm">Review and manage employee leave requests</p>
          </div>
          <Button icon={Plus} onClick={handleAdd}>Add Request</Button>
        </div>
      </div>

      {/* Pending Alert Banner */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in stagger-1">
          <div className="p-2 bg-amber-100 rounded-xl">
            <AlertCircle className="text-amber-600" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-amber-800 font-semibold text-sm">
              You have {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} to review
            </p>
            <p className="text-amber-600 text-xs font-medium">Action required — please approve or reject</p>
          </div>
          <button
            onClick={() => setStatusFilter('Pending')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Status Tabs + Search + Type Filter */}
      <div className="mb-6 space-y-4 animate-fade-in stagger-2">
        {/* Segmented status pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {tab === 'Pending' && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex-1" />

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Vacation">Vacation</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Training">Training</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Request Cards */}
      <div className="animate-slide-up stagger-3">
        {loading ? (
          <LoadingSkeleton />
        ) : filteredAbsences.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <EmptyState 
              title="No requests found"
              description={searchTerm || statusFilter !== 'All' || typeFilter !== 'All' 
                ? "Try adjusting your filters" 
                : "No leave requests have been submitted yet"}
              icon={FileText}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAbsences.map((row) => {
              const statusConfig = getStatusConfig(row.status);
              const typeConfig = getTypeConfig(row.type);
              const StatusIcon = statusConfig.icon;
              const days = getDaysDiff(row.start_date, row.end_date);
              const isPending = row.status === 'Pending';

              return (
                <div
                  key={row.id}
                  className={`bg-white border rounded-2xl border-l-4 transition-all duration-200 hover:shadow-md ${statusConfig.accent} ${
                    isPending ? 'border-amber-200 shadow-sm' : 'border-slate-100'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Employee Info */}
                      <div className="flex items-center gap-3 min-w-0 sm:w-56 flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                          {row.employee_name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{row.employee_name}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                            {row.type}
                          </span>
                        </div>
                      </div>

                      {/* Date Range + Duration */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="font-medium">
                            {new Date(row.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-slate-300">→</span>
                          <span className="font-medium">
                            {new Date(row.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-xs text-slate-400 font-medium ml-1">
                            ({days} day{days !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {/* Mini timeline bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                            <div 
                              className={`h-full rounded-full ${
                                row.status === 'Validated' ? 'bg-emerald-400' : 
                                row.status === 'Rejected' ? 'bg-rose-400' : 'bg-amber-400'
                              }`}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                        {row.reason && (
                          <p className="text-xs text-slate-500 mt-1.5 truncate max-w-md" title={row.reason}>
                            "{row.reason}"
                          </p>
                        )}
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                          <StatusIcon size={13} />
                          {row.status}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {!isEmployee && isPending && (
                            <>
                              <button
                                title="Approve"
                                onClick={() => handleValidate(row.id)}
                                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all hover:scale-110 active:scale-95"
                              >
                                <CheckCircle2 size={18} strokeWidth={2.5} />
                              </button>
                              <button
                                title="Reject"
                                onClick={() => handleReject(row.id)}
                                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all hover:scale-110 active:scale-95"
                              >
                                <XCircle size={18} strokeWidth={2.5} />
                              </button>
                            </>
                          )}
                          {(!isEmployee || isPending) && (
                            <button
                              title="Edit"
                              onClick={() => handleEdit(row)}
                              className="p-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {(!isEmployee || isPending) && (
                            <button
                              title="Delete"
                              onClick={() => handleDelete(row.id)}
                              className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <Pagination 
              page={page} 
              limit={limit} 
              total={total} 
              totalPages={totalPages} 
              onPageChange={(newPage) => setPage(newPage)} 
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAbsence ? 'Edit Request' : 'Add Request'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEmployee && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
              <select
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Vacation">Vacation</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Training">Training</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveRequests;

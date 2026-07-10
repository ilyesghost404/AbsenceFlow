import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAbsences, createAbsence, updateAbsence, deleteAbsence, validateAbsence, rejectAbsence } from '../services/absenceService';
import { getEmployees } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';

const Absences = () => {
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [absencesData, employeesData] = await Promise.all([
        getAbsences(),
        getEmployees(),
      ]);
      setAbsences(absencesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
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

  let columns = [
    {
      header: 'Employee',
      render: (row) => row.employee_name,
    },
    { header: 'Type', key: 'type' },
    { header: 'Start Date', key: 'start_date' },
    { header: 'End Date', key: 'end_date' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.status === 'Validated' ? 'bg-green-100 text-green-700' :
          row.status === 'Rejected' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {row.status}
        </span>
      ),
    },
    { header: 'Reason', key: 'reason' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {!isEmployee && row.status === 'Pending' && (
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
          {(!isEmployee || row.status === 'Pending') && (
            <button
              title="Edit"
              aria-label="Edit absence"
              onClick={() => handleEdit(row)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm border border-blue-100"
            >
              <Edit2 size={16} strokeWidth={2.5} />
            </button>
          )}
          {(!isEmployee || row.status === 'Pending') && (
            <button
              title="Delete"
              aria-label="Delete absence"
              onClick={() => handleDelete(row.id)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm border border-red-100"
            >
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isEmployee) {
    columns = columns.filter(col => col.header !== 'Employee');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{isEmployee ? 'My Requests' : 'Absences'}</h1>
        <Button icon={Plus} onClick={handleAdd}>Add Absence</Button>
      </div>
      <Card>
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
            <p className="text-center text-slate-500 mt-4">Loading absences...</p>
          </div>
        ) : (
          <Table columns={columns} data={absences} emptyMessage="No absences found" />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAbsence ? 'Edit Absence' : 'Add Absence'}
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
          <div className="grid grid-cols-2 gap-4">
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

export default Absences;

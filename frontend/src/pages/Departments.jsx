import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Building2, Plus, Search, Edit2, Trash2, 
  Users, Loader2, AlertCircle 
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentDept, setCurrentDept] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load departments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, dept = null) => {
    setModalMode(mode);
    if (dept) {
      setCurrentDept({ ...dept });
    } else {
      setCurrentDept({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (modalMode === 'add') {
        await api.post('/departments', currentDept);
        toast.success('Department created successfully');
      } else {
        await api.put(`/departments/${currentDept.id}`, currentDept);
        toast.success('Department updated successfully');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode} department`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/departments/${deptToDelete.id}`);
      toast.success('Department deleted successfully');
      setIsDeleteModalOpen(false);
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (dept.description && dept.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Building2 size={24} />
            </div>
            Departments
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage company organizational structure</p>
        </div>
        <Button onClick={() => handleOpenModal('add')} className="shadow-lg shadow-blue-500/20">
          <Plus size={20} className="mr-2" /> Add Department
        </Button>
      </div>

      <Card className="p-0 border-0 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:font-normal"
            />
          </div>
          <div className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Total: {filteredDepartments.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 pl-6 w-1/3">Department Name</th>
                <th className="p-4 w-1/3">Description</th>
                <th className="p-4 w-1/6">Employees</th>
                <th className="p-4 pr-6 w-1/6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Building2 size={20} />
                      </div>
                      <span className="font-bold text-slate-700">{dept.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-slate-500 font-medium truncate max-w-xs">
                      {dept.description || <span className="text-slate-300 italic">No description</span>}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                        <Users size={16} />
                      </div>
                      <span className="font-bold text-slate-700">{dept.employee_count}</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal('edit', dept)}
                        className="p-2 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-all shadow-sm"
                        title="Edit Department"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => { setDeptToDelete(dept); setIsDeleteModalOpen(true); }}
                        className="p-2 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-all shadow-sm"
                        title="Delete Department"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                        <Building2 size={32} />
                      </div>
                      <p>No departments found.</p>
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-sm text-blue-600 hover:underline font-bold"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Create New Department' : 'Edit Department'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Department Name</label>
            <input
              type="text"
              required
              value={currentDept.name}
              onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
              placeholder="e.g. Human Resources"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
            <textarea
              rows="3"
              value={currentDept.description || ''}
              onChange={(e) => setCurrentDept({ ...currentDept, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none"
              placeholder="Brief description of the department's role..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !currentDept.name.trim()}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2"/> Saving...</> : 'Save Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Delete Department"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Are you absolutely sure?</h3>
          <p className="text-slate-500 text-sm font-medium">
            You are about to delete the <strong>{deptToDelete?.name}</strong> department.
            {deptToDelete?.employee_count > 0 && (
              <span className="block mt-2 text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">
                ⚠️ Warning: {deptToDelete.employee_count} employee(s) currently assigned to this department will be left unassigned.
              </span>
            )}
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2"/> Deleting...</> : 'Yes, Delete it'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Departments;

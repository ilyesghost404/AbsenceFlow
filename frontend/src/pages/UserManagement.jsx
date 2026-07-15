import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, UserPlus, Edit2, Trash2, Shield, UserCheck, UserX, 
  Mail, Link as LinkIcon, Lock, Activity, Search, Clock
} from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { getEmployees } from '../services/employeeService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    employee_id: '',
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, employeesResponse] = await Promise.all([
        getUsers({ page, limit, search: searchTerm }),
        getEmployees({ limit: 1000 }) // fetch all for select dropdown
      ]);
      setUsers(usersResponse.data);
      setTotal(usersResponse.total);
      setTotalPages(usersResponse.totalPages);
      setEmployees(employeesResponse.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user management data');
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
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'employee',
      employee_id: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Blank by default, only updated if entered
      role: user.role,
      employee_id: user.employee_id || '',
      is_active: user.is_active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        toast.success('User deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.employee_id || payload.role !== 'employee') {
        delete payload.employee_id;
      } else {
        payload.employee_id = parseInt(payload.employee_id);
      }

      if (editingUser) {
        // Password is optional for updates
        if (!payload.password) {
          delete payload.password;
        }
        await updateUser(editingUser.id, payload);
        toast.success('User updated successfully');
      } else {
        await createUser(payload);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const filteredUsers = users; // Server-side filtering applied

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      manager: 'bg-amber-100 text-amber-700 border-amber-200',
      employee: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[role] || 'bg-slate-100 text-slate-700'}`}>
        {role.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (isActive, accountStatus) => {
    if (accountStatus === 'Pending') {
      return (
        <span className="flex items-center gap-1 text-amber-600 font-semibold text-sm">
          <Clock size={16} /> Pending
        </span>
      );
    }
    return isActive ? (
      <span className="flex items-center gap-1 text-green-700 font-semibold text-sm">
        <UserCheck size={16} /> Active
      </span>
    ) : (
      <span className="flex items-center gap-1 text-slate-400 font-semibold text-sm">
        <UserX size={16} /> Disabled
      </span>
    );
  };

  const columns = [
    {
      header: 'Username',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">
            {row.username[0]}
          </div>
          <span className="font-semibold text-slate-800">{row.username}</span>
        </div>
      )
    },
    { header: 'Email', key: 'email' },
    {
      header: 'Role',
      render: (row) => getRoleBadge(row.role)
    },
    {
      header: 'Linked Employee',
      render: (row) => (
        row.employee_name ? (
          <span className="flex items-center gap-1 text-slate-700 text-sm">
            <LinkIcon size={14} className="text-slate-400" />
            {row.employee_name}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">Unlinked</span>
        )
      )
    },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row.is_active, row.account_status)
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Edit2} onClick={() => handleEdit(row)}>Edit</Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(row.id)}>Delete</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Users className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
          </div>
          <p className="text-slate-500">Configure access credentials, roles, and employee linkage</p>
        </div>
        <Button icon={UserPlus} onClick={handleAdd}>Add User</Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-slate-700"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-slate-500 mt-4 text-sm font-medium">Fetching accounts...</p>
          </div>
        ) : (
          <>
            <Table columns={columns} data={filteredUsers} emptyMessage="No users matching description found" />
            <Pagination 
              page={page} 
              limit={limit} 
              total={total} 
              totalPages={totalPages} 
              onPageChange={(newPage) => setPage(newPage)} 
            />
          </>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Credentials' : 'Create User Account'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm"
              placeholder="e.g. john.doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm"
                placeholder="e.g. john.doe@company.com"
              />
            </div>
          </div>

          {editingUser && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password (Leave blank to keep current)
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm"
                  placeholder="Leave blank to keep unchanged"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value, employee_id: e.target.value === 'employee' ? formData.employee_id : '' })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm"
              >
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account Status</label>
              <select
                value={formData.is_active ? 'active' : 'disabled'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm"
              >
                <option value="active">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          {formData.role === 'employee' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link to Employee Profile</label>
              <select
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm"
              >
                <option value="">Select Employee profile</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    [{emp.matricule}] {emp.first_name} {emp.last_name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;

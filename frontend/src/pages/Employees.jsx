import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, UserCheck, Building, TrendingUp, Search, Filter } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/employeeService';

// Timezone-safe local date parser
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    matricule: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hire_date: '',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      matricule: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      hire_date: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
        toast.success('Employee deleted successfully');
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
        toast.success('Employee updated successfully');
      } else {
        await createEmployee(formData);
        toast.success('Employee created successfully');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Failed to save employee');
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))].length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newThisMonth = employees.filter(e => {
      const hireDate = parseLocalDate(e.hire_date);
      return hireDate && hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
    }).length;
    
    return { total, active: total, departments, newThisMonth };
  }, [employees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = !searchTerm || 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesDept = !departmentFilter || emp.department === departmentFilter;
      const matchesStatus = true; // All are active for now
      
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    return [...new Set(employees.map(e => e.department).filter(Boolean))];
  }, [employees]);

  // Function to get initials from name
  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Employees</h1>
            <p className="text-slate-500">Manage and track your organization's employees</p>
          </div>
          <Button icon={Plus} onClick={handleAdd}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50">
              <Users className="text-blue-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Active Employees</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50">
              <UserCheck className="text-green-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Departments</p>
              <p className="text-3xl font-bold text-purple-600">{stats.departments}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50">
              <Building className="text-purple-600" size={28} />
            </div>
          </div>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">New This Month</p>
              <p className="text-3xl font-bold text-amber-600">{stats.newThisMonth}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50">
              <TrendingUp className="text-amber-600" size={28} />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search employees by name, matricule, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-4">
            <Filter className="text-slate-400" size={20} />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="py-3 bg-transparent focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="text-slate-500 mt-4">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-slate-400" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No employees found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Matricule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {getInitials(employee.first_name, employee.last_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {employee.first_name} {employee.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-600">{employee.matricule}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{employee.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">
                        {employee.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{employee.position}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-xl text-xs font-semibold">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleEdit(employee)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(employee.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Matricule</label>
            <input
              type="text"
              required
              value={formData.matricule}
              onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Hire Date</label>
            <input
              type="date"
              required
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Employees;

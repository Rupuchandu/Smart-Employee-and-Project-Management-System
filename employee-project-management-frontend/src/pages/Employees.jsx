import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search, Plus, Edit, Trash2, Mail, Phone, Building, Eye, DollarSign, UserCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const employeeSchema = yup.object({
  employeeId: yup.string().nullable(),
  firstName: yup
    .string()
    .required('First name is required')
    .matches(/^[a-zA-Z\s]+$/, 'First name must contain only alphabets (no numbers or special characters)')
    .min(3, 'First name must be at least 3 characters')
    .max(30, 'First name cannot exceed 30 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .matches(/^[a-zA-Z\s]+$/, 'Last name must contain only alphabets (no numbers or special characters)')
    .max(30, 'Last name cannot exceed 30 characters'),
  email: yup.string().required('Email is required').email('Valid email is required'),
  phone: yup
    .string()
    .required('Phone is required')
    .matches(/^[0-9]{10}$/, 'Contact number must be exactly 10 digits without spaces or symbols'),
  department: yup.string().required('Department is required'),
  role: yup.string().required('Role/Designation is required'),
  status: yup.string().required('Status is required'),
  salary: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .typeError('Salary must be a positive number')
    .positive('Salary must be a positive number'),
  age: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .typeError('Age must be a number')
    .integer('Age must be an integer')
    .min(18, 'Age must be between 18 and 65')
    .max(65, 'Age must be between 18 and 65'),
}).required();

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [toast, setToast] = useState({ type: '', message: '' });
  const [showModal, setShowModal] = useState(false);
  const [viewEmployeeModal, setViewEmployeeModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(employeeSchema),
    mode: 'onChange',
    defaultValues: {
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      role: '',
      status: 'ACTIVE',
      salary: '',
      age: '',
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, [searchQuery, filterDepartment, filterStatus]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/employees${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (response.data.success) {
        let result = response.data.data;
        if (filterDepartment) {
          result = result.filter((e) => e.department && e.department.toLowerCase().includes(filterDepartment.toLowerCase()));
        }
        if (filterStatus) {
          result = result.filter((e) => e.status === filterStatus);
        }
        setEmployees(result);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to fetch employees' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedEmployee(null);
    reset({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      role: '',
      status: 'ACTIVE',
      salary: '',
      age: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (employee) => {
    setSelectedEmployee(employee);
    reset({
      employeeId: employee.employeeId || '',
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      role: employee.role || '',
      status: employee.status || 'ACTIVE',
      salary: employee.salary || '',
      age: employee.age || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setActionLoading(true);
    try {
      if (selectedEmployee) {
        const res = await api.put(`/employees/${selectedEmployee.id}`, data);
        if (res.data.success) {
          setToast({ type: 'success', message: 'Employee updated successfully!' });
          setShowModal(false);
          fetchEmployees();
        }
      } else {
        const res = await api.post('/employees', data);
        if (res.data.success) {
          setToast({ type: 'success', message: 'Employee created and welcome email sent!' });
          setShowModal(false);
          fetchEmployees();
        }
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || 'Action failed';
      if (serverMsg.includes('DUPLICATE_EMAIL') || serverMsg.toLowerCase().includes('email')) {
        setError('email', { type: 'manual', message: 'Employee email already exists!' });
        setToast({ type: 'error', message: 'Duplicate Error: Employee email already exists!' });
      } else if (serverMsg.includes('DUPLICATE_PHONE') || serverMsg.toLowerCase().includes('phone') || serverMsg.toLowerCase().includes('contact')) {
        setError('phone', { type: 'manual', message: 'Employee contact number already exists!' });
        setToast({ type: 'error', message: 'Duplicate Error: Employee contact number already exists!' });
      } else if (serverMsg.includes('DUPLICATE_NAME') || serverMsg.toLowerCase().includes('name')) {
        setError('firstName', { type: 'manual', message: 'An employee with this name already exists!' });
        setError('lastName', { type: 'manual', message: 'An employee with this name already exists!' });
        setToast({ type: 'error', message: 'Duplicate Error: An employee with this name already exists!' });
      } else {
        setToast({ type: 'error', message: serverMsg });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/employees/${deleteConfirm.id}`);
      if (res.data.success) {
        setToast({ type: 'success', message: 'Employee deleted successfully' });
        setDeleteConfirm({ isOpen: false, id: null, name: '' });
        fetchEmployees();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete employee' });
    } finally {
      setActionLoading(false);
    }
  };

  const onInvalid = (errs) => {
    const firstMsg = Object.values(errs)[0]?.message;
    if (firstMsg) {
      setToast({ type: 'error', message: `Form Validation Error: ${firstMsg}` });
    }
  };

  return (
    <div>
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />}

      {/* Identical Search Filter Bar */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
          <div className="input-group" style={{ maxWidth: '280px' }}>
            <span className="input-group-text bg-transparent border-end-0 border border-secondary border-opacity-25 text-muted">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by name, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select className="form-select w-auto" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Human Resources">HR</option>
          </select>

          <select className="form-select w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <button className="btn btn-primary-custom d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Employees Table */}
      {loading ? (
        <Loader message="Loading employees list..." />
      ) : (
        <div className="custom-table-container">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>ID</th>
                  <th>Department & Role</th>
                  <th>Contact Number</th>
                  <th>Age</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      No employees found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {emp.profilePhoto ? (
                            <img
                              src={emp.profilePhoto}
                              alt={emp.name}
                              className="rounded-circle border border-primary border-opacity-50 shadow-sm"
                              style={{ width: '42px', height: '42px', objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div className="avatar bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center font-bold" style={{ width: '42px', height: '42px', flexShrink: 0 }}>
                              {emp.firstName ? emp.firstName.charAt(0).toUpperCase() : 'E'}
                            </div>
                          )}
                          <div>
                            <div className="fw-bold">{emp.name}</div>
                            <small className="text-muted d-flex align-items-center gap-1">
                              <Mail size={12} /> {emp.email}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25 font-semibold">
                          {emp.employeeId}
                        </span>
                      </td>
                      <td>
                        <div className="fw-medium">{emp.role}</div>
                        <small className="text-muted d-flex align-items-center gap-1">
                          <Building size={12} /> {emp.department}
                        </small>
                      </td>
                      <td>
                        <div className="fw-medium d-flex align-items-center gap-1">
                          <Phone size={14} className="text-primary" /> {emp.phone || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <span className="fw-semibold">{emp.age ? `${emp.age} yrs` : 'N/A'}</span>
                      </td>
                      <td>
                        <span className="fw-bold text-success">
                          ${emp.salary ? emp.salary.toLocaleString() : '0'}
                        </span>
                      </td>
                      <td>
                        <span className={emp.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2 rounded-3" onClick={() => setViewEmployeeModal(emp)} title="View Employee Details">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-info me-2 rounded-3" onClick={() => handleOpenEditModal(emp)} title="Edit Employee">
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => setDeleteConfirm({ isOpen: true, id: emp.id, name: emp.name })} title="Delete Employee">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {viewEmployeeModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-secondary">
              <div className="modal-header">
                <h5 className="modal-title font-bold">Employee Details - {viewEmployeeModal.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewEmployeeModal(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-secondary bg-opacity-10 rounded-3">
                  {viewEmployeeModal.profilePhoto ? (
                    <img
                      src={viewEmployeeModal.profilePhoto}
                      alt={viewEmployeeModal.name}
                      className="rounded-circle border border-2 border-primary shadow"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center font-bold" style={{ width: '56px', height: '56px', fontSize: '1.5rem', flexShrink: 0 }}>
                      {viewEmployeeModal.firstName ? viewEmployeeModal.firstName.charAt(0).toUpperCase() : 'E'}
                    </div>
                  )}
                  <div>
                    <h5 className="mb-0 font-bold">{viewEmployeeModal.name}</h5>
                    <small className="text-muted">{viewEmployeeModal.role} ({viewEmployeeModal.department})</small>
                    <div className="mt-1">
                      <span className="badge bg-primary bg-opacity-25 text-primary me-2">{viewEmployeeModal.employeeId}</span>
                      <span className={viewEmployeeModal.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}>{viewEmployeeModal.status}</span>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <div className="p-3 border border-secondary border-opacity-25 rounded-3">
                      <small className="text-muted d-block mb-1"><Mail size={14} className="me-1" /> Email Address</small>
                      <strong className="text-truncate d-block">{viewEmployeeModal.email}</strong>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 border border-secondary border-opacity-25 rounded-3">
                      <small className="text-muted d-block mb-1"><Phone size={14} className="me-1 text-primary" /> Contact Number</small>
                      <strong className="text-primary">{viewEmployeeModal.phone || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 border border-secondary border-opacity-25 rounded-3">
                      <small className="text-muted d-block mb-1"><UserCheck size={14} className="me-1 text-info" /> Age</small>
                      <strong>{viewEmployeeModal.age ? `${viewEmployeeModal.age} Years Old` : 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 border border-secondary border-opacity-25 rounded-3">
                      <small className="text-muted d-block mb-1"><DollarSign size={14} className="me-1 text-success" /> Salary</small>
                      <strong className="text-success">${viewEmployeeModal.salary ? viewEmployeeModal.salary.toLocaleString() : 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setViewEmployeeModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-secondary">
              <div className="modal-header">
                <h5 className="modal-title">{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name (Alphabets only)</label>
                      <input
                        type="text"
                        className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                        placeholder="John"
                        onKeyDown={(e) => {
                          if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                          if (/[0-9]/.test(e.key) || /[^a-zA-Z\s]/.test(e.key)) {
                            e.preventDefault();
                            setError('firstName', { type: 'manual', message: 'Alphabets only (numbers/symbols not allowed)' });
                          } else {
                            clearErrors('firstName');
                          }
                        }}
                        {...register('firstName')}
                      />
                      {errors.firstName && (
                        <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.firstName.message}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name (Alphabets only)</label>
                      <input
                        type="text"
                        className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                        placeholder="Doe"
                        onKeyDown={(e) => {
                          if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                          if (/[0-9]/.test(e.key) || /[^a-zA-Z\s]/.test(e.key)) {
                            e.preventDefault();
                            setError('lastName', { type: 'manual', message: 'Alphabets only (numbers/symbols not allowed)' });
                          } else {
                            clearErrors('lastName');
                          }
                        }}
                        {...register('lastName')}
                      />
                      {errors.lastName && (
                        <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.lastName.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="john.doe@company.com"
                        {...register('email')}
                      />
                      {errors.email && (
                        <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.email.message}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Contact Number (Exactly 10 Digits)</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        placeholder="9876543210"
                        maxLength="10"
                        onKeyDown={(e) => {
                          if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                            setError('phone', { type: 'manual', message: 'Contact number accepts digits only' });
                          } else {
                            clearErrors('phone');
                          }
                        }}
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.phone.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Department</label>
                      <input type="text" className={`form-control ${errors.department ? 'is-invalid' : ''}`} placeholder="Engineering" {...register('department')} />
                      {errors.department && (
                        <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.department.message}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Role / Designation</label>
                      <input type="text" className={`form-control ${errors.role ? 'is-invalid' : ''}`} placeholder="Software Engineer" {...register('role')} />
                      {errors.role && (
                        <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.role.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Age (18 - 65)</label>
                      <input
                        type="number"
                        className={`form-control ${errors.age ? 'is-invalid' : ''}`}
                        placeholder="28"
                        onKeyDown={(e) => {
                          if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                            setError('age', { type: 'manual', message: 'Age accepts digits only (18 to 65)' });
                          } else {
                            clearErrors('age');
                          }
                        }}
                        {...register('age')}
                      />
                      {errors.age && (
                        <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.age.message}
                        </div>
                      )}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Salary (Positive Number)</label>
                      <input
                        type="number"
                        className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                        placeholder="75000"
                        onKeyDown={(e) => {
                          if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                            setError('salary', { type: 'manual', message: 'Salary accepts numeric digits only' });
                          } else {
                            clearErrors('salary');
                          }
                        }}
                        {...register('salary')}
                      />
                      {errors.salary && (
                        <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.salary.message}
                        </div>
                      )}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Status</label>
                      <select className={`form-select ${errors.status ? 'is-invalid' : ''}`} {...register('status')}>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                      {errors.status && <div className="invalid-feedback">{errors.status.message}</div>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)} disabled={actionLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : selectedEmployee ? 'Update Employee' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteConfirm.name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        loading={actionLoading}
      />
    </div>
  );
};

export default Employees;

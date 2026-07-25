import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search, Plus, Edit, Trash2, Calendar, Users, Building, FolderKanban, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const projectSchema = yup.object({
  projectName: yup.string().required('Project name is required').max(100, 'Project name cannot exceed 100 characters'),
  description: yup.string().required('Description is required'),
  client: yup.string().required('Client name is required'),
  department: yup.string().nullable(),
  priority: yup.string().required('Priority is required').oneOf(['LOW', 'MEDIUM', 'HIGH'], 'Invalid priority'),
  status: yup.string().required('Status is required').oneOf(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'], 'Invalid status'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup
    .string()
    .required('End date is required')
    .test('is-after-start', 'End date cannot be before start date', function (value) {
      const { startDate } = this.parent;
      return !startDate || !value || new Date(value) >= new Date(startDate);
    }),
}).required();

const formatDateStr = (dateStr) => {
  if (!dateStr) return 'TBD';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const Projects = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [projects, setProjects] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [toast, setToast] = useState({ type: '', message: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(projectSchema),
    mode: 'onChange',
    defaultValues: {
      projectName: '',
      description: '',
      client: '',
      department: '',
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
    fetchProjects();
    fetchEmployeesList();
  }, [searchQuery, filterDepartment, filterPriority, filterStatus]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/projects${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (response.data.success) {
        let result = response.data.data;
        if (filterDepartment) {
          result = result.filter((p) => p.department && p.department.toLowerCase().includes(filterDepartment.toLowerCase()));
        }
        if (filterPriority) {
          result = result.filter((p) => p.priority === filterPriority);
        }
        if (filterStatus) {
          result = result.filter((p) => p.status === filterStatus);
        }
        setProjects(result);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to fetch projects' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const response = await api.get('/employees');
      if (response.data.success) {
        setEmployeesList(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load employee list', err);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedProject(null);
    setSelectedEmployeeIds([]);
    reset({
      projectName: '',
      description: '',
      client: '',
      department: '',
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (project) => {
    setSelectedProject(project);
    setSelectedEmployeeIds(project.assignedEmployeeIds || []);
    reset({
      projectName: project.projectName || '',
      description: project.description || '',
      client: project.client || '',
      department: project.department || '',
      priority: project.priority || 'MEDIUM',
      status: project.status || 'NOT_STARTED',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
    });
    setShowModal(true);
  };

  const toggleEmployeeSelection = (id) => {
    if (selectedEmployeeIds.includes(id)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter((empId) => empId !== id));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, id]);
    }
  };

  const onSubmit = async (data) => {
    setActionLoading(true);
    const payload = {
      ...data,
      assignedEmployeeIds: selectedEmployeeIds,
    };

    try {
      if (selectedProject) {
        const res = await api.put(`/projects/${selectedProject.id}`, payload);
        if (res.data.success) {
          setToast({ type: 'success', message: 'Project updated successfully!' });
          setShowModal(false);
          fetchProjects();
        }
      } else {
        const res = await api.post('/projects', payload);
        if (res.data.success) {
          setToast({ type: 'success', message: 'Project created and team notified!' });
          setShowModal(false);
          fetchProjects();
        }
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/projects/${deleteConfirm.id}`);
      if (res.data.success) {
        setToast({ type: 'success', message: 'Project deleted successfully' });
        setDeleteConfirm({ isOpen: false, id: null, name: '' });
        fetchProjects();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete project' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="badge-in-progress">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="badge-completed">COMPLETED</span>;
      case 'ON_HOLD':
        return <span className="badge-on-hold">ON HOLD</span>;
      default:
        return <span className="badge-not-started">NOT STARTED</span>;
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
              placeholder="Search projects..."
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
          </select>

          <select className="form-select w-auto" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select className="form-select w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">NOT STARTED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ON_HOLD">ON HOLD</option>
          </select>
        </div>

        {isAdmin && (
          <button className="btn btn-primary-custom d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Projects Table */}
      {loading ? (
        <Loader message="Loading project records..." />
      ) : (
        <div className="custom-table-container">
          {(() => {
            const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE) || 1;
            const paginatedProjects = projects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
            const startIdx = projects.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
            const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, projects.length);

            return (
              <>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Client & Dept</th>
                        <th>Timeline</th>
                        <th>Assigned Team</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            No projects found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedProjects.map((proj) => (
                          <tr key={proj.id}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <div className="avatar bg-purple bg-opacity-25 text-purple rounded-3 d-flex align-items-center justify-content-center font-bold" style={{ width: '40px', height: '40px', color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)', flexShrink: 0 }}>
                                  <FolderKanban size={20} />
                                </div>
                                <div>
                                  <div className="fw-bold">{proj.projectName}</div>
                                  <small className="text-muted text-truncate d-block" style={{ maxWidth: '220px' }}>
                                    {proj.description || 'No description'}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="fw-medium d-flex align-items-center gap-1">
                                <Building size={14} className="text-muted" /> {proj.client}
                              </div>
                              <small className="text-muted">{proj.department || 'General'}</small>
                            </td>
                            <td>
                              <div className="small font-medium d-flex align-items-center gap-1">
                                <Calendar size={13} className="text-primary" />
                                <span>{formatDateStr(proj.startDate)}</span>
                                <ArrowRight size={12} className="text-muted" />
                                <span>{formatDateStr(proj.endDate)}</span>
                              </div>
                            </td>
                            <td>
                              {proj.assignedEmployees && proj.assignedEmployees.length > 0 ? (
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge bg-primary bg-opacity-25 text-primary font-bold">
                                    {proj.assignedEmployees.length} {proj.assignedEmployees.length === 1 ? 'Member' : 'Members'}
                                  </span>
                                  <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '200px' }}>
                                    {proj.assignedEmployees.map((emp) => (
                                      <span key={emp.id} className="badge bg-secondary bg-opacity-25 border border-secondary border-opacity-25 text-body" style={{ fontSize: '0.75rem' }}>
                                        {emp.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted small">No Team Assigned</span>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-info bg-opacity-25 text-info">{proj.priority || 'MEDIUM'}</span>
                            </td>
                            <td>{getStatusBadge(proj.status)}</td>
                            <td className="text-end">
                              <button className="btn btn-sm btn-outline-info me-2 rounded-3" onClick={() => handleOpenEditModal(proj)} title={isAdmin ? "Edit Project" : "Update Project Status"}>
                                <Edit size={16} />
                              </button>
                              {isAdmin && (
                                <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => setDeleteConfirm({ isOpen: true, id: proj.id, name: proj.projectName })} title="Delete Project">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {projects.length > 0 && (
                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 mt-3 pt-3 border-top border-secondary border-opacity-25">
                    <small className="text-muted font-medium">
                      Showing <span className="text-body fw-bold">{startIdx}</span> to <span className="text-body fw-bold">{endIdx}</span> of <span className="text-body fw-bold">{projects.length}</span> projects (Limit: 10 per page)
                    </small>

                    {totalPages > 1 && (
                      <div className="d-flex align-items-center gap-1">
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-2 px-2 d-inline-flex align-items-center"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                          title="First Page"
                        >
                          <ChevronsLeft size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-2 px-3 d-inline-flex align-items-center gap-1"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        >
                          <ChevronLeft size={16} /> Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            className={`btn btn-sm rounded-2 px-3 ${currentPage === pageNum ? 'btn-primary-custom fw-bold' : 'btn-outline-secondary'}`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        ))}
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-2 px-3 d-inline-flex align-items-center gap-1"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        >
                          Next <ChevronRight size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-2 px-2 d-inline-flex align-items-center"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          title="Last Page"
                        >
                          <ChevronsRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-secondary">
              <div className="modal-header">
                <h5 className="modal-title">{selectedProject ? (isAdmin ? 'Edit Project' : 'Update Project Status') : 'Create New Project'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
                <div className="modal-body">
                  {!isAdmin && (
                    <div className="alert alert-info py-2 px-3 mb-3 small d-flex align-items-center gap-2">
                      <span className="fw-bold">Note:</span> As an Employee, you can update the Project Status. Core project details are managed by Admin.
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Project Name</label>
                      <input type="text" className={`form-control ${errors.projectName ? 'is-invalid' : ''}`} placeholder="" disabled={!isAdmin} {...register('projectName')} />
                      {errors.projectName && <div className="invalid-feedback">{errors.projectName.message}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Client Name</label>
                      <input type="text" className={`form-control ${errors.client ? 'is-invalid' : ''}`} placeholder="" disabled={!isAdmin} {...register('client')} />
                      {errors.client && <div className="invalid-feedback">{errors.client.message}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Project Description</label>
                    <textarea className={`form-control ${errors.description ? 'is-invalid' : ''}`} rows="3" placeholder="" disabled={!isAdmin} {...register('description')}></textarea>
                    {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date</label>
                      <input type="date" className={`form-control ${errors.startDate ? 'is-invalid' : ''}`} disabled={!isAdmin} {...register('startDate')} />
                      {errors.startDate && <div className="invalid-feedback">{errors.startDate.message}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date / Deadline</label>
                      <input type="date" className={`form-control ${errors.endDate ? 'is-invalid' : ''}`} disabled={!isAdmin} {...register('endDate')} />
                      {errors.endDate && <div className="invalid-feedback">{errors.endDate.message}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Priority</label>
                      <select className={`form-select ${errors.priority ? 'is-invalid' : ''}`} disabled={!isAdmin} {...register('priority')}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                      </select>
                      {errors.priority && <div className="invalid-feedback">{errors.priority.message}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-semibold">Project Status {isAdmin ? '(Updated via Employee Task Progress)' : '(Editable)'}</label>
                      <select className={`form-select ${isAdmin ? 'text-muted' : 'border-primary'} ${errors.status ? 'is-invalid' : ''}`} disabled={isAdmin} {...register('status')}>
                        <option value="NOT_STARTED">NOT STARTED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="ON_HOLD">ON HOLD</option>
                      </select>
                      {errors.status && <div className="invalid-feedback">{errors.status.message}</div>}
                    </div>
                  </div>

                  {/* Multi-Employee Team Assignment */}
                  <div className="mb-3">
                    <label className="form-label font-bold d-flex align-items-center gap-1">
                      <Users size={16} className="text-primary" />
                      Assign Team Members (Select Multiple Employees)
                    </label>
                    <div className="p-3 border border-secondary border-opacity-25 rounded-3" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                      {employeesList.length === 0 ? (
                        <small className="text-muted">No employees registered yet.</small>
                      ) : (
                        <div className="row g-2">
                          {employeesList.map((emp) => (
                            <div key={emp.id} className="col-md-6">
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`emp-${emp.id}`}
                                  checked={selectedEmployeeIds.includes(emp.id)}
                                  disabled={!isAdmin}
                                  onChange={() => toggleEmployeeSelection(emp.id)}
                                />
                                <label className="form-check-label small" htmlFor={`emp-${emp.id}`}>
                                  {emp.name} ({emp.department})
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)} disabled={actionLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : selectedProject ? 'Update Status' : 'Save Project'}
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
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        loading={actionLoading}
      />
    </div>
  );
};

export default Projects;

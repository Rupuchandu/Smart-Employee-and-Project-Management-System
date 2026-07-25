import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search, Plus, Edit, Trash2, Calendar, User, Briefcase, SlidersHorizontal, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const taskSchema = yup.object({
  taskTitle: yup.string().required('Task title is required'),
  description: yup.string().required('Description is required'),
  assignedEmployeeId: yup.number().required('Assigned employee is required'),
  projectId: yup.number().required('Project is required'),
  priority: yup.string().required('Priority is required'),
  status: yup.string().required('Status is required'),
  dueDate: yup
    .string()
    .required('Due date is required')
    .test('is-future-date', 'Due date must be a future date', (value) => {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(value) >= today;
    }),
  progressPercentage: yup.number().min(0).max(100).nullable(),
  remarks: yup.string().nullable(),
}).required();

const progressSchema = yup.object({
  progressPercentage: yup.number().min(0).max(100).required('Progress percentage is required'),
  status: yup.string().required('Status is required'),
  remarks: yup.string().nullable(),
}).required();

const isOverdue = (dueDateStr, status) => {
  if (!dueDateStr || status === 'COMPLETED') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr);
  return dueDate < today;
};

const Tasks = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [tasks, setTasks] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [toast, setToast] = useState({ type: '', message: '' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register: registerTask,
    handleSubmit: handleSubmitTask,
    reset: resetTask,
    formState: { errors: taskErrors, isValid: isTaskValid },
  } = useForm({
    resolver: yupResolver(taskSchema),
    mode: 'onChange',
  });

  const {
    register: registerProgress,
    handleSubmit: handleSubmitProgress,
    reset: resetProgress,
    setValue: setProgressValue,
    watch: watchProgress,
  } = useForm({
    resolver: yupResolver(progressSchema),
    mode: 'onChange',
  });

  const currentProgress = watchProgress('progressPercentage', 0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
    fetchTasks();
    if (isAdmin) {
      fetchDropdownData();
    }
  }, [searchQuery, filterStatus, filterPriority]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `/tasks?`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterPriority) url += `priority=${filterPriority}&`;

      const response = await api.get(url);
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to fetch tasks' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [empRes, projRes] = await Promise.all([
        api.get('/employees'),
        api.get('/projects'),
      ]);
      if (empRes.data.success) setEmployeesList(empRes.data.data);
      if (projRes.data.success) setProjectsList(projRes.data.data);
    } catch (err) {
      console.error('Failed to load task metadata', err);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedTask(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    resetTask({
      taskTitle: '',
      description: '',
      assignedEmployeeId: employeesList[0]?.id || '',
      projectId: projectsList[0]?.id || '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: tomorrowStr,
      progressPercentage: 0,
      remarks: '',
    });
    setShowTaskModal(true);
  };

  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
    resetTask({
      taskTitle: task.taskTitle || '',
      description: task.description || '',
      assignedEmployeeId: task.assignedEmployeeId || '',
      projectId: task.projectId || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'TODO',
      dueDate: task.dueDate || '',
      progressPercentage: task.progressPercentage || 0,
      remarks: task.remarks || '',
    });
    setShowTaskModal(true);
  };

  const handleOpenProgressModal = (task) => {
    setSelectedTask(task);
    resetProgress({
      progressPercentage: task.progressPercentage || 0,
      status: task.status || 'IN_PROGRESS',
      remarks: task.remarks || '',
    });
    setShowProgressModal(true);
  };

  const onSubmitTask = async (data) => {
    setActionLoading(true);
    try {
      if (selectedTask) {
        const res = await api.put(`/tasks/${selectedTask.id}`, data);
        if (res.data.success) {
          setToast({ type: 'success', message: 'Task updated successfully!' });
          setShowTaskModal(false);
          fetchTasks();
        }
      } else {
        const res = await api.post('/tasks', data);
        if (res.data.success) {
          setToast({ type: 'success', message: 'Task assigned and employee notified!' });
          setShowTaskModal(false);
          fetchTasks();
        }
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Task operation failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const onSubmitProgress = async (data) => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/tasks/${selectedTask.id}/progress`, data);
      if (res.data.success) {
        setToast({ type: 'success', message: 'Task progress updated successfully!' });
        setShowProgressModal(false);
        fetchTasks();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Progress update failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteConfirm.id) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/tasks/${deleteConfirm.id}`);
      if (res.data.success) {
        setToast({ type: 'success', message: 'Task deleted successfully' });
        setDeleteConfirm({ isOpen: false, id: null, name: '' });
        fetchTasks();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete task' });
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-2 py-1">URGENT</span>;
      case 'HIGH':
        return <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25 px-2 py-1">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-2 py-1">MEDIUM</span>;
      default:
        return <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25 px-2 py-1">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge-completed">COMPLETED</span>;
      case 'IN_PROGRESS':
        return <span className="badge-in-progress">IN PROGRESS</span>;
      case 'IN_REVIEW':
        return <span className="badge-on-hold">IN REVIEW</span>;
      default:
        return <span className="badge-not-started">TO DO</span>;
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

      {/* Header Actions & Filters */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
          <div className="input-group" style={{ maxWidth: '280px' }}>
            <span className="input-group-text bg-transparent border-end-0 border border-secondary border-opacity-25 text-muted">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select className="form-select w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="TODO">TO DO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="IN_REVIEW">IN REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <select className="form-select w-auto" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        {isAdmin && (
          <button className="btn btn-primary-custom d-flex align-items-center gap-2" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Tasks Table */}
      {loading ? (
        <Loader message="Loading tasks..." />
      ) : (
        <div className="custom-table-container">
          {(() => {
            const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE) || 1;
            const paginatedTasks = tasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
            const startIdx = tasks.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
            const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, tasks.length);

            return (
              <>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Task Title</th>
                        <th>Project & Assignee</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Progress (%)</th>
                        <th>Due Date</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            No tasks found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedTasks.map((task) => {
                          const overdue = isOverdue(task.dueDate, task.status);
                          return (
                            <tr key={task.id} className={overdue ? 'row-overdue' : ''}>
                              <td>
                                <div className="fw-bold mb-1 d-flex align-items-center gap-2">
                                  {task.taskTitle}
                                  {overdue && (
                                    <span className="badge-overdue d-inline-flex align-items-center gap-1">
                                      <AlertTriangle size={12} /> OVERDUE
                                    </span>
                                  )}
                                </div>
                                <small className="text-muted text-truncate d-block" style={{ maxWidth: '280px' }}>
                                  {task.description || 'No description'}
                                </small>
                              </td>
                              <td>
                                <div className="fw-medium small d-flex align-items-center gap-1">
                                  <Briefcase size={12} className="text-primary" /> {task.projectName}
                                </div>
                                <small className="text-muted d-flex align-items-center gap-1">
                                  <User size={12} /> {task.assignedEmployeeName}
                                </small>
                              </td>
                              <td>{getPriorityBadge(task.priority)}</td>
                              <td>{getStatusBadge(task.status)}</td>
                              <td style={{ minWidth: '140px' }}>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="progress flex-grow-1 bg-secondary bg-opacity-25" style={{ height: '8px', borderRadius: '4px' }}>
                                    <div
                                      className={`progress-bar ${task.progressPercentage === 100 ? 'bg-success' : 'bg-primary'}`}
                                      role="progressbar"
                                      style={{ width: `${task.progressPercentage || 0}%` }}
                                    ></div>
                                  </div>
                                  <small className="font-bold" style={{ width: '36px' }}>{task.progressPercentage || 0}%</small>
                                </div>
                              </td>
                              <td>
                                <small className={`d-flex align-items-center gap-1 ${overdue ? 'text-danger font-bold' : 'text-muted'}`}>
                                  <Calendar size={12} /> {task.dueDate || 'N/A'}
                                </small>
                              </td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-primary me-2 rounded-3"
                                  onClick={() => handleOpenProgressModal(task)}
                                  title="Update Progress & Remarks"
                                >
                                  <SlidersHorizontal size={16} />
                                </button>

                                {isAdmin && (
                                  <button
                                    className="btn btn-sm btn-outline-info me-2 rounded-3"
                                    onClick={() => handleOpenEditModal(task)}
                                    title="Edit Task"
                                  >
                                    <Edit size={16} />
                                  </button>
                                )}

                                {isAdmin && (
                                  <button
                                    className="btn btn-sm btn-outline-danger rounded-3"
                                    onClick={() => setDeleteConfirm({ isOpen: true, id: task.id, name: task.taskTitle })}
                                    title="Delete Task"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {tasks.length > 0 && (
                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 mt-3 pt-3 border-top border-secondary border-opacity-25">
                    <small className="text-muted font-medium">
                      Showing <span className="text-body fw-bold">{startIdx}</span> to <span className="text-body fw-bold">{endIdx}</span> of <span className="text-body fw-bold">{tasks.length}</span> tasks (Limit: 10 per page)
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

      {/* Admin Task Create/Edit Modal */}
      {showTaskModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-secondary">
              <div className="modal-header">
                <h5 className="modal-title">{selectedTask ? 'Edit Task' : 'Create New Task'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTaskModal(false)}></button>
              </div>
              <form onSubmit={handleSubmitTask(onSubmitTask, onInvalid)} noValidate>
                <div className="modal-body">
                  {!isAdmin && (
                    <div className="alert alert-info py-2 px-3 mb-3 small d-flex align-items-center gap-2">
                      <span className="fw-bold">Note:</span> As an Employee, you can update Task Status. Core task assignment details are managed by Admin.
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Task Title</label>
                    <input type="text" className={`form-control ${taskErrors.taskTitle ? 'is-invalid' : ''}`} placeholder="Implement OAuth2 Filter" disabled={!isAdmin} {...registerTask('taskTitle')} />
                    {taskErrors.taskTitle && <div className="invalid-feedback">{taskErrors.taskTitle.message}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Task Description</label>
                    <textarea className={`form-control ${taskErrors.description ? 'is-invalid' : ''}`} rows="3" placeholder="Provide detailed task scope..." disabled={!isAdmin} {...registerTask('description')}></textarea>
                    {taskErrors.description && <div className="invalid-feedback">{taskErrors.description.message}</div>}
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Assigned Project</label>
                      <select className={`form-select ${taskErrors.projectId ? 'is-invalid' : ''}`} disabled={!isAdmin} {...registerTask('projectId')}>
                        <option value="">Select Project</option>
                        {projectsList.map((p) => (
                          <option key={p.id} value={p.id}>{p.projectName}</option>
                        ))}
                      </select>
                      {taskErrors.projectId && <div className="invalid-feedback">{taskErrors.projectId.message}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Assigned Employee</label>
                      <select className={`form-select ${taskErrors.assignedEmployeeId ? 'is-invalid' : ''}`} disabled={!isAdmin} {...registerTask('assignedEmployeeId')}>
                        <option value="">Select Employee</option>
                        {employeesList.map((e) => (
                          <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                        ))}
                      </select>
                      {taskErrors.assignedEmployeeId && <div className="invalid-feedback">{taskErrors.assignedEmployeeId.message}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Priority</label>
                      <select className="form-select" disabled={!isAdmin} {...registerTask('priority')}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label font-semibold">Status {isAdmin ? '(Managed by Assigned Employee)' : '(Editable)'}</label>
                      <select className={`form-select ${isAdmin ? 'text-muted' : 'border-primary'}`} disabled={isAdmin} {...registerTask('status')}>
                        <option value="TODO">TO DO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="IN_REVIEW">IN REVIEW</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Due Date</label>
                      <input type="date" className={`form-control ${taskErrors.dueDate ? 'is-invalid' : ''}`} disabled={!isAdmin} {...registerTask('dueDate')} />
                      {taskErrors.dueDate && <div className="invalid-feedback">{taskErrors.dueDate.message}</div>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowTaskModal(false)} disabled={actionLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : selectedTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Remarks Update Modal */}
      {showProgressModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-secondary">
              <div className="modal-header">
                <h5 className="modal-title">Update Progress - {selectedTask?.taskTitle}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowProgressModal(false)}></button>
              </div>
              <form onSubmit={handleSubmitProgress(onSubmitProgress, onInvalid)} noValidate>
                <div className="modal-body">
                  <div className="mb-4 text-center">
                    <label className="form-label font-bold d-block mb-2">Progress: {currentProgress}%</label>
                    <input
                      type="range"
                      className="form-range"
                      min="0"
                      max="100"
                      step="5"
                      {...registerProgress('progressPercentage')}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProgressValue('progressPercentage', val);
                        if (val === 100) setProgressValue('status', 'COMPLETED');
                        else if (val > 0) setProgressValue('status', 'IN_PROGRESS');
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Task Status</label>
                    <select className="form-select" {...registerProgress('status')}>
                      <option value="TODO">TO DO</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="IN_REVIEW">IN REVIEW</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Employee Remarks / Updates</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Add status notes or blockers..."
                      {...registerProgress('remarks')}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowProgressModal(false)} disabled={actionLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Progress'}
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
        title="Delete Task"
        message={`Are you sure you want to delete task "${deleteConfirm.name}"?`}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        loading={actionLoading}
      />
    </div>
  );
};

export default Tasks;

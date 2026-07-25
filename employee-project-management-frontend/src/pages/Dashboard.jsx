import React, { useState, useEffect } from 'react';
import { Users, Briefcase, CheckSquare, Clock, CheckCircle2, AlertTriangle, ArrowRight, Activity, RefreshCw, UserCheck, UserX, ShieldAlert, SlidersHorizontal, Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Dashboard Table Pagination States (10 items per page limit)
  const [recentPage, setRecentPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const DASHBOARD_PAGE_SIZE = 10;

  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalProjects: 0,
    totalTasks: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingTasks: 0,
    completedTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    myAssignedTasksCount: 0,
    myCompletedTasksCount: 0,
    myPendingTasksCount: 0,
    upcomingDeadlines: [],
    recentTasks: [],
  });

  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Quick Status Update Modal state directly from Dashboard
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: '',
    status: 'TODO',
    progressPercentage: 0,
    remarks: '',
  });
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    if (isAdmin) {
      fetchPendingUsers();
      fetchPendingProfilePhotos();
    }
  }, [isAdmin]);

  const fetchPendingProfilePhotos = async () => {
    try {
      const response = await api.get('/users/pending-photos');
      if (response.data.success) {
        setPendingPhotos(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending profile photo requests:', err);
    }
  };

  const handleApprovePhoto = async (userId) => {
    try {
      const response = await api.put(`/users/${userId}/approve-photo`);
      if (response.data.success) {
        setActionSuccess('Profile photo approved successfully!');
        fetchPendingProfilePhotos();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve profile photo.');
    }
  };

  const handleRejectPhoto = async (userId) => {
    try {
      const response = await api.put(`/users/${userId}/reject-photo`);
      if (response.data.success) {
        setActionSuccess('Profile photo request rejected.');
        fetchPendingProfilePhotos();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject profile photo.');
    }
  };

  const openStatusModal = (task) => {
    setStatusModal({
      isOpen: true,
      taskId: task.id,
      taskTitle: task.taskTitle || task.title,
      status: task.status || 'TODO',
      progressPercentage: task.progressPercentage || 0,
      remarks: task.remarks || '',
    });
  };

  const handleSaveStatusUpdate = async (e) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const payload = {
        progressPercentage: Number(statusModal.progressPercentage),
        status: statusModal.status,
        remarks: statusModal.remarks,
      };
      const response = await api.patch(`/tasks/${statusModal.taskId}/progress`, payload);
      if (response.data.success) {
        setActionSuccess(`Task "${statusModal.taskTitle}" status updated to ${statusModal.status}!`);
        setStatusModal({ isOpen: false, taskId: null, taskTitle: '', status: 'TODO', progressPercentage: 0, remarks: '' });
        fetchDashboardStats(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setSavingStatus(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/users/pending-registrations');
      if (response.data.success) {
        setPendingUsers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending user registrations:', err);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const response = await api.put(`/users/${userId}/approve`);
      if (response.data.success) {
        setActionSuccess('Employee registration approved successfully!');
        fetchPendingUsers();
        fetchDashboardStats(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve registration.');
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      const response = await api.put(`/users/${userId}/reject`);
      if (response.data.success) {
        setActionSuccess('Employee registration rejected.');
        fetchPendingUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject registration.');
    }
  };

  const fetchDashboardStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load live dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <Loader message="Fetching live system metrics..." />;
  }

  return (
    <div>
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}

      {/* Header Refresh Row */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {user?.name || 'User'}!
          </h4>
          <p className="text-muted small mb-0">Live metrics & updates for {isAdmin ? 'System Administrator' : 'Assigned Employee'}</p>
        </div>

        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 rounded-3"
          onClick={() => fetchDashboardStats(true)}
          disabled={refreshing}
          title="Refresh Live Data"
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Admin View Dashboard */}
      {isAdmin ? (
        <>
          {/* Top Metric Cards Row 1 */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-sm-6 col-xl-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Total Employees</span>
                  <h2 className="mb-0 mt-2 font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalEmployees ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-primary bg-opacity-15 text-primary">
                  <Users size={26} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Total Projects</span>
                  <h2 className="mb-0 mt-2 font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalProjects ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-purple bg-opacity-15 text-purple" style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                  <Briefcase size={26} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Total Tasks</span>
                  <h2 className="mb-0 mt-2 font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalTasks ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-info bg-opacity-15 text-info">
                  <CheckSquare size={26} />
                </div>
              </div>
            </div>
          </div>

          {/* Top Metric Cards Row 2 */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-sm-6 col-xl-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Pending Tasks</span>
                  <h2 className="mb-0 mt-2 font-extrabold text-warning">
                    {stats.pendingTasks ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-warning bg-opacity-15 text-warning">
                  <Clock size={26} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Completed Tasks</span>
                  <h2 className="mb-0 mt-2 font-extrabold text-success">
                    {stats.completedTasks ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-success bg-opacity-15 text-success">
                  <CheckCircle2 size={26} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Active Projects</span>
                  <h2 className="mb-0 mt-2 font-extrabold text-primary">
                    {stats.activeProjects ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-primary bg-opacity-15 text-primary">
                  <Activity size={26} />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Registration Requests Table for Admin */}
          {pendingUsers.length > 0 && (
            <div className="stat-card mb-4 border-warning border-opacity-50">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="font-bold mb-0 d-flex align-items-center gap-2 text-warning">
                  <ShieldAlert size={20} />
                  Pending Employee Registration Requests ({pendingUsers.length})
                </h5>
                <span className="badge bg-warning bg-opacity-25 text-warning font-semibold">Approval Required</span>
              </div>

              {actionSuccess && <Toast type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />}

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Age</th>
                      <th>Expected Salary</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-bold">{u.firstName} {u.lastName}</td>
                        <td className="text-muted">{u.email}</td>
                        <td>{u.phone || 'N/A'}</td>
                        <td>{u.age ? `${u.age} yrs` : 'N/A'}</td>
                        <td>{u.salary ? `$${u.salary}` : 'N/A'}</td>
                        <td><span className="badge bg-warning bg-opacity-20 text-warning">PENDING</span></td>
                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-success d-flex align-items-center gap-1 py-1 px-3 rounded-2"
                              onClick={() => handleApproveUser(u.id)}
                            >
                              <UserCheck size={16} /> Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 py-1 px-3 rounded-2"
                              onClick={() => handleRejectUser(u.id)}
                            >
                              <UserX size={16} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Profile Photo Approval Requests Table for Admin */}
          {pendingPhotos.length > 0 && (
            <div className="stat-card mb-4 border-info border-opacity-50">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="font-bold mb-0 d-flex align-items-center gap-2 text-info">
                  <ShieldAlert size={20} />
                  Pending Employee Profile Photo Approvals ({pendingPhotos.length})
                </h5>
                <span className="badge bg-info bg-opacity-25 text-info font-semibold">Photo Review Required</span>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Submitted Photo</th>
                      <th>Employee Name</th>
                      <th>Email</th>
                      <th>Mobile No</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPhotos.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <img
                            src={u.pendingProfilePhoto}
                            alt="Submitted Photo"
                            className="rounded-circle border border-warning shadow-sm"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        </td>
                        <td className="fw-bold">{u.firstName} {u.lastName}</td>
                        <td className="text-muted">{u.email}</td>
                        <td>{u.phone || 'N/A'}</td>
                        <td><span className="badge bg-warning bg-opacity-20 text-warning">PENDING APPROVAL</span></td>
                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-success d-flex align-items-center gap-1 py-1 px-3 rounded-2"
                              onClick={() => handleApprovePhoto(u.id)}
                            >
                              <UserCheck size={16} /> Approve Photo
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 py-1 px-3 rounded-2"
                              onClick={() => handleRejectPhoto(u.id)}
                            >
                              <UserX size={16} /> Reject Photo
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Activity Grid */}
          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <div className="stat-card h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="font-bold mb-0" style={{ color: 'var(--text-primary)' }}>Recent Tasks Activity</h5>
                  <Link to="/tasks" className="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1">
                    Manage Tasks <ArrowRight size={14} />
                  </Link>
                </div>
                {(() => {
                  const tasksList = stats.recentTasks || [];
                  const totalPages = Math.ceil(tasksList.length / DASHBOARD_PAGE_SIZE) || 1;
                  const paginated = tasksList.slice((recentPage - 1) * DASHBOARD_PAGE_SIZE, recentPage * DASHBOARD_PAGE_SIZE);

                  return (
                    <>
                      <div className="table-responsive">
                        <table className="table align-middle">
                          <thead>
                            <tr>
                              <th>Task</th>
                              <th>Project</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasksList.length > 0 ? (
                              paginated.map((t) => (
                                <tr key={t.id}>
                                  <td className="fw-medium">{t.taskTitle}</td>
                                  <td className="text-muted small">{t.projectName}</td>
                                  <td>
                                    <span className={`badge ${t.status === 'COMPLETED' ? 'badge-completed' : 'badge-in-progress'}`}>
                                      {t.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan="3" className="text-muted text-center py-4">No tasks recorded yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {tasksList.length > 0 && (
                        <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-secondary border-opacity-25 small">
                          <span className="text-muted">
                            Page {recentPage} of {totalPages} ({tasksList.length} total)
                          </span>
                          <div className="d-flex align-items-center gap-1">
                            <button
                              className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-2"
                              disabled={recentPage === 1}
                              onClick={() => setRecentPage((p) => Math.max(p - 1, 1))}
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-2"
                              disabled={recentPage === totalPages}
                              onClick={() => setRecentPage((p) => Math.min(p + 1, totalPages))}
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="stat-card h-100">
                <h5 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Task Status Breakdown</h5>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>TO DO ({stats.todoTasks ?? 0})</span>
                    <span>{stats.totalTasks > 0 ? Math.round((stats.todoTasks / stats.totalTasks) * 100) : 0}%</span>
                  </div>
                  <div className="progress bg-secondary bg-opacity-15" style={{ height: '8px' }}>
                    <div className="progress-bar bg-secondary" style={{ width: `${stats.totalTasks > 0 ? (stats.todoTasks / stats.totalTasks) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>IN PROGRESS ({stats.inProgressTasks ?? 0})</span>
                    <span>{stats.totalTasks > 0 ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100) : 0}%</span>
                  </div>
                  <div className="progress bg-secondary bg-opacity-15" style={{ height: '8px' }}>
                    <div className="progress-bar bg-info" style={{ width: `${stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>COMPLETED ({stats.completedTasks ?? 0})</span>
                    <span>{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
                  </div>
                  <div className="progress bg-secondary bg-opacity-15" style={{ height: '8px' }}>
                    <div className="progress-bar bg-success" style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Employee View Dashboard */
        <>
          <div className="row g-4 mb-4">
            <div className="col-12 col-sm-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Assigned Tasks</span>
                  <h2 className="mb-0 mt-2 font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {stats.myAssignedTasksCount ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-primary bg-opacity-15 text-primary">
                  <CheckSquare size={26} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Pending Tasks</span>
                  <h2 className="mb-0 mt-2 font-extrabold text-warning">
                    {stats.myPendingTasksCount ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-warning bg-opacity-15 text-warning">
                  <Clock size={26} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-4">
              <div className="stat-card d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted font-semibold text-uppercase small">Completed Tasks</span>
                  <h2 className="mb-0 mt-2 font-extrabold text-success">
                    {stats.myCompletedTasksCount ?? 0}
                  </h2>
                </div>
                <div className="stat-icon-wrapper bg-success bg-opacity-15 text-success">
                  <CheckCircle2 size={26} />
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="font-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle size={20} className="text-warning" />
                Upcoming Task Deadlines
              </h5>
              <Link to="/tasks" className="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1">
                View All My Tasks <ArrowRight size={14} />
              </Link>
            </div>

            {(() => {
              const deadlinesList = stats.upcomingDeadlines || [];
              const totalPages = Math.ceil(deadlinesList.length / DASHBOARD_PAGE_SIZE) || 1;
              const paginated = deadlinesList.slice((upcomingPage - 1) * DASHBOARD_PAGE_SIZE, upcomingPage * DASHBOARD_PAGE_SIZE);

              return (
                <>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Task Title</th>
                          <th>Project</th>
                          <th>Priority</th>
                          <th>Due Date</th>
                          <th>Progress</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deadlinesList.length > 0 ? (
                          paginated.map((t) => (
                            <tr key={t.id}>
                              <td className="fw-bold">{t.taskTitle}</td>
                              <td className="text-muted">{t.projectName}</td>
                              <td><span className="badge bg-secondary bg-opacity-25 text-body">{t.priority}</span></td>
                              <td><span className="small text-warning">{t.dueDate}</span></td>
                              <td>{t.progressPercentage}%</td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-primary py-1 px-2 rounded-2 small d-inline-flex align-items-center gap-1"
                                  onClick={() => openStatusModal(t)}
                                  title="Update Task Status"
                                >
                                  <SlidersHorizontal size={14} /> Update Status
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" className="text-muted text-center py-4">No upcoming task deadlines found!</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {deadlinesList.length > 0 && (
                    <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top border-secondary border-opacity-25 small">
                      <span className="text-muted font-medium">
                        Showing page {upcomingPage} of {totalPages} ({deadlinesList.length} total tasks)
                      </span>
                      {totalPages > 1 && (
                        <div className="d-flex align-items-center gap-1">
                          <button
                            className="btn btn-sm btn-outline-secondary px-2 rounded-2 d-inline-flex align-items-center gap-1"
                            disabled={upcomingPage === 1}
                            onClick={() => setUpcomingPage((p) => Math.max(p - 1, 1))}
                          >
                            <ChevronLeft size={16} /> Prev
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary px-2 rounded-2 d-inline-flex align-items-center gap-1"
                            disabled={upcomingPage === totalPages}
                            onClick={() => setUpcomingPage((p) => Math.min(p + 1, totalPages))}
                          >
                            Next <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Quick Task Status Update Modal */}
      {statusModal.isOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-secondary">
              <div className="modal-header">
                <h5 className="modal-title">Update Task Status - {statusModal.taskTitle}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setStatusModal({ isOpen: false, taskId: null, taskTitle: '', status: 'TODO', progressPercentage: 0, remarks: '' })}></button>
              </div>
              <form onSubmit={handleSaveStatusUpdate}>
                <div className="modal-body">
                  <div className="mb-4 text-center">
                    <label className="form-label font-bold d-block mb-2">Progress: {statusModal.progressPercentage}%</label>
                    <input
                      type="range"
                      className="form-range"
                      min="0"
                      max="100"
                      step="5"
                      value={statusModal.progressPercentage}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStatusModal((prev) => ({
                          ...prev,
                          progressPercentage: val,
                          status: val === 100 ? 'COMPLETED' : val > 0 ? 'IN_PROGRESS' : prev.status,
                        }));
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Task Status</label>
                    <select
                      className="form-select border-primary"
                      value={statusModal.status}
                      onChange={(e) => setStatusModal((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="TODO">TO DO</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="IN_REVIEW">IN REVIEW</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Update Remarks / Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Add status notes or progress update..."
                      value={statusModal.remarks}
                      onChange={(e) => setStatusModal((prev) => ({ ...prev, remarks: e.target.value }))}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setStatusModal({ isOpen: false, taskId: null, taskTitle: '', status: 'TODO', progressPercentage: 0, remarks: '' })} disabled={savingStatus}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom" disabled={savingStatus}>
                    {savingStatus ? 'Updating...' : 'Save Task Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

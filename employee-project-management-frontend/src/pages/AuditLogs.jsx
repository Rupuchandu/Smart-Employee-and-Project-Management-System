import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Shield,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
  Layers,
} from 'lucide-react';

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const itemsPerPage = 10;

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedModule) params.module = selectedModule;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/audit-logs', { params });
      if (response.data.success) {
        setLogs(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedModule, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedModule('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Client-side sorting & pagination
  const sortedLogs = [...logs].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage) || 1;
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getModuleBadgeClass = (module) => {
    switch (module) {
      case 'Authentication':
        return 'bg-primary text-white';
      case 'Employee':
        return 'bg-info text-dark';
      case 'Project':
        return 'bg-success text-white fw-bold';
      case 'Task':
        return 'bg-warning text-dark';
      case 'Registration':
        return 'bg-purple text-white';
      case 'Reports':
        return 'bg-secondary text-white';
      default:
        return 'bg-dark text-white';
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger shadow-sm rounded-3 d-flex align-items-center gap-3">
          <Shield size={24} />
          <div>
            <h5 className="mb-1 font-bold">Access Denied</h5>
            <p className="mb-0">Only System Administrators can view Audit Logs.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4 border border-1 border-light d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo rounded-3 d-flex align-items-center justify-content-center">
            <Shield size={28} className="text-primary" />
          </div>
          <div>
            <h3 className="fw-bold text-dark mb-1">System Audit Logs</h3>
            <p className="text-muted mb-0">Track all security events, authentication attempts, and data operations</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary rounded-3 d-flex align-items-center gap-2"
          onClick={fetchAuditLogs}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4 border border-1 border-light">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-end">
          {/* Search Box */}
          <div className="col-lg-4 col-md-6">
            <label className="form-label text-muted fw-semibold small mb-1">Search Keywords</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 bg-light"
                placeholder="Search username, action, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Module Filter */}
          <div className="col-lg-2 col-md-6">
            <label className="form-label text-muted fw-semibold small mb-1">Module</label>
            <select
              className="form-select bg-light"
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Modules</option>
              <option value="Authentication">Authentication</option>
              <option value="Employee">Employee</option>
              <option value="Project">Project</option>
              <option value="Task">Task</option>
              <option value="Registration">Registration</option>
              <option value="Reports">Reports</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="col-lg-2 col-md-4">
            <label className="form-label text-muted fw-semibold small mb-1">Start Date</label>
            <input
              type="date"
              className="form-control bg-light"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* End Date */}
          <div className="col-lg-2 col-md-4">
            <label className="form-label text-muted fw-semibold small mb-1">End Date</label>
            <input
              type="date"
              className="form-control bg-light"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Search & Reset Buttons */}
          <div className="col-lg-2 col-md-4 d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1 rounded-3 d-flex align-items-center justify-content-center gap-1">
              <Search size={16} /> Search
            </button>
            <button
              type="button"
              className="btn btn-light text-muted border rounded-3"
              onClick={handleResetFilters}
              title="Reset Filters"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main Logs Table */}
      <div className="bg-white rounded-4 shadow-sm border border-1 border-light overflow-hidden">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
          <div className="d-flex align-items-center gap-2 text-muted fw-semibold">
            <Activity size={18} />
            <span>Total Records: <strong className="text-dark">{sortedLogs.length}</strong></span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small fw-semibold">Sort Timestamp:</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-2"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'desc' ? 'Newest First ↓' : 'Oldest First ↑'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-5 text-center text-muted">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="mb-0">Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-danger">
            <p className="mb-0">{error}</p>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <Shield size={48} className="mb-3 text-secondary opacity-50" />
            <h5>No Audit Logs Found</h5>
            <p className="text-muted small">Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase fw-bold">
                <tr>
                  <th style={{ width: '180px' }}>Date & Time</th>
                  <th style={{ width: '220px' }}>User</th>
                  <th style={{ width: '110px' }}>Role</th>
                  <th style={{ width: '140px' }}>Module</th>
                  <th style={{ width: '160px' }}>Action</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => {
                  const isProject = log.module === 'Project';
                  return (
                    <tr key={log.id}>
                      {/* Timestamp */}
                      <td className="text-nowrap small text-muted">
                        <div className="d-flex align-items-center gap-2">
                          <Calendar size={14} className="text-primary" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Username */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light rounded-circle p-2 text-muted d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                            <User size={14} />
                          </div>
                          <span className="fw-semibold text-dark text-break">{log.username}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <span className={`badge px-2 py-1 ${log.userRole === 'ADMIN' ? 'bg-danger text-white' : 'bg-secondary text-white'}`}>
                          {log.userRole}
                        </span>
                      </td>

                      {/* Module */}
                      <td>
                        <span
                          className={`badge px-2.5 py-1.5 rounded-2 ${
                            isProject
                              ? 'bg-success text-white fw-bold shadow-sm fs-6'
                              : getModuleBadgeClass(log.module)
                          }`}
                          style={isProject ? { backgroundColor: '#10B981', color: '#ffffff' } : undefined}
                        >
                          {log.module}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <span className="fw-bold text-dark">{log.action}</span>
                      </td>

                      {/* Description */}
                      <td className="text-muted small">
                        {log.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light bg-opacity-30">
            <span className="text-muted small">
              Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, sortedLogs.length)}</strong> of <strong>{sortedLogs.length}</strong> logs (10 per set)
            </span>

            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center gap-1"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`btn btn-sm rounded-3 px-2 py-1 ${currentPage === pageNum ? 'btn-primary font-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center gap-1"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;

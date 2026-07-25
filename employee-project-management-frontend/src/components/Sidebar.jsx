import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, CheckSquare, FileText, User, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import api from '../services/api';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    try {
      await api.post('/audit-logs/logout', { email: user?.email });
    } catch (e) {}
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
          <ShieldCheck size={24} color="#ffffff" />
        </div>
        <span style={{ color: 'var(--text-primary)' }}>Smart EPMS</span>
      </div>

      <ul className="sidebar-nav">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        </li>

        {isAdmin && (
          <>
            <li>
              <NavLink to="/employees" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
                <Users size={20} />
                <span>Employees</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
                <ShieldCheck size={20} />
                <span>Audit Logs</span>
              </NavLink>
            </li>
          </>
        )}

        <li>
          <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <Briefcase size={20} />
            <span>{isAdmin ? 'Projects' : 'My Projects'}</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/tasks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <CheckSquare size={20} />
            <span>{isAdmin ? 'Task Management' : 'My Tasks'}</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <FileText size={20} />
            <span>Reports</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        </li>
      </ul>

      <div className="mt-auto pt-4 border-top border-secondary border-opacity-25">
        <div className="d-flex align-items-center mb-3 px-2">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user?.name || 'User'}
              className="rounded-circle me-3 border border-primary border-opacity-50 shadow-sm"
              style={{ width: '40px', height: '40px', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div className="avatar me-3 bg-primary rounded-circle d-flex align-items-center justify-content-center text-white font-bold" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="overflow-hidden">
            <h6 className="mb-0 text-truncate font-semibold" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user?.name || 'User'}</h6>
            <small className="text-muted text-truncate d-block" style={{ fontSize: '0.75rem' }}>{user?.role || 'USER'}</small>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 py-2">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

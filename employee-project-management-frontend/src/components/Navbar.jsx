import React from 'react';
import { Menu, Sun, Moon, Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ toggleSidebar, title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar-custom">
      <div className="d-flex align-items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="btn btn-icon border-secondary border-opacity-25 d-lg-none"
          aria-label="Toggle Sidebar"
          style={{ color: 'var(--text-primary)' }}
        >
          <Menu size={20} />
        </button>
        <h4 className="mb-0 font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-outline-secondary d-flex align-items-center gap-2 rounded-pill px-3 py-1"
          style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <>
              <Moon size={16} className="text-primary" />
              <span className="small font-medium d-none d-sm-inline">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={16} className="text-warning" />
              <span className="small font-medium d-none d-sm-inline">Light Mode</span>
            </>
          )}
        </button>

        {/* User Info Badge */}
        <div className="d-none d-md-flex align-items-center gap-2 px-3 py-1 bg-secondary bg-opacity-10 rounded-pill border border-secondary border-opacity-25">
          <ShieldCheck size={16} className="text-primary" />
          <span className="small font-semibold" style={{ color: 'var(--text-primary)' }}>
            {user?.name || user?.email || 'User'}
          </span>
          <span className="badge bg-primary bg-opacity-25 text-primary ms-1" style={{ fontSize: '0.7rem' }}>
            {user?.role || 'USER'}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

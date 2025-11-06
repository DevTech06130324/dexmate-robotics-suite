import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuthContext();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/groups', label: 'Groups' },
  ];

  return (
    <div className="app-shell">
      <div className="celestial-haze" aria-hidden />
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link to="/dashboard" className="brand">
          RoboManage
        </Link>
        <nav className="main-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span>{item.label}</span>
              {location.pathname.startsWith(item.to) && (
                <motion.span
                  layoutId="navHighlight"
                  className="nav-highlight"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <span className="user-chip">
            <span className="user-dot" />
            {user?.name}
          </span>
          <button type="button" className="btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </motion.header>
      <motion.main
        className="app-main"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
};

export default Layout;

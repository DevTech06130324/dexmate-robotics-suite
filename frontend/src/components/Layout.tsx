import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, LogOut, Sparkles } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuthContext();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'Groups', icon: Users },
  ];

  return (
    <div className="app-shell">
      <div className="celestial-haze" aria-hidden />
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <Link to="/dashboard" className="brand">
          <motion.div
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={24} style={{ display: 'inline' }} />
            RoboManage
          </motion.div>
        </Link>
        <nav className="main-nav">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <motion.div
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>
        <motion.div 
          className="header-actions"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.span className="user-chip">
            <span className="user-dot" />
            {user?.name}
          </motion.span>
          <button
            type="button"
            className="btn-secondary"
            onClick={logout}
          >
            <LogOut size={16} style={{ marginRight: '0.5rem' }} />
            Log out
          </button>
        </motion.div>
      </motion.header>
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="app-main"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default Layout;

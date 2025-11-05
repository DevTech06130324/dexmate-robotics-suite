import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuthContext();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/dashboard" className="brand">
          RoboManage
        </Link>
        <nav className="main-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/groups">Groups</NavLink>
        </nav>
        <div className="header-actions">
          <span className="user-chip">{user?.name}</span>
          <button type="button" className="btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

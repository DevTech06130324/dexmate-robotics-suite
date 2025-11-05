import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import RobotDetailPage from './pages/RobotDetail';
import GroupsPage from './pages/Groups';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/"
      element={(
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      )}
    >
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="robots/:serialNumber" element={<RobotDetailPage />} />
      <Route path="groups" element={<GroupsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </AuthProvider>
);

export default App;

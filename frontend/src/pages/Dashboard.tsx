import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';
import { createRobot, listRobots } from '../services/robots';
import { Robot } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuthContext();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [newRobotName, setNewRobotName] = useState('');
  const [newRobotSerial, setNewRobotSerial] = useState('');
  const [newRobotModel, setNewRobotModel] = useState('');

  useEffect(() => {
    const fetchRobots = async () => {
      try {
        setLoading(true);
        const data = await listRobots();
        setRobots(data);
        setError(null);
      } catch (err) {
        setError('Failed to load robots');
      } finally {
        setLoading(false);
      }
    };

    fetchRobots();
  }, []);

  const refreshRobots = async () => {
    try {
      const data = await listRobots();
      setRobots(data);
      setError(null);
    } catch (err) {
      setError('Failed to load robots');
    }
  };

  const handleCreateRobot = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newRobotName.trim() || !newRobotSerial.trim()) {
      setCreateError('Robot name and serial number are required.');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      setStatusMessage(null);
      await createRobot({
        name: newRobotName.trim(),
        serialNumber: newRobotSerial.trim(),
        model: newRobotModel.trim() || undefined,
        ownerType: 'user',
      });
      setNewRobotName('');
      setNewRobotSerial('');
      setNewRobotModel('');
      setStatusMessage('Personal robot successfully commissioned.');
      await refreshRobots();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error ?? 'Unable to create robot.');
    } finally {
      setCreating(false);
    }
  };

  const totalRobots = robots.length;
  const personalRobots = useMemo(
    () => robots.filter((robot) => robot.ownership_type === 'personal').length,
    [robots],
  );
  const groupRobots = useMemo(
    () => robots.filter((robot) => robot.ownership_type === 'group').length,
    [robots],
  );
  const elevatedAccess = useMemo(
    () => robots.filter((robot) => ['owner', 'admin'].includes(robot.permission_level)).length,
    [robots],
  );

  const skeletonSlots = Array.from({ length: 4 });

  return (
    <div className="page dashboard-page">
      <section className="page-header dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow">Mission control</span>
          <h1>Welcome back, {user?.name ?? 'Operator'}</h1>
          <p>Personalize every robot in your fleet, orchestrate group access, and keep your automations in sync.</p>
          <div className="hero-actions">
            <Link to="/groups" className="btn-secondary hero-cta">
              Manage groups
            </Link>
            <a className="btn-ghost" href="#create-personal-robot">
              Launch new unit
            </a>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-label">Robots online</span>
            {loading ? <span className="stat-placeholder skeleton-line" /> : <span className="stat-value">{totalRobots}</span>}
          </div>
          <div className="stat-card">
            <span className="stat-label">Personal ownership</span>
            {loading ? (
              <span className="stat-placeholder skeleton-line" />
            ) : (
              <span className="stat-value">{personalRobots}</span>
            )}
          </div>
          <div className="stat-card">
            <span className="stat-label">Group units</span>
            {loading ? <span className="stat-placeholder skeleton-line" /> : <span className="stat-value">{groupRobots}</span>}
          </div>
          <div className="stat-card">
            <span className="stat-label">Admin privileges</span>
            {loading ? (
              <span className="stat-placeholder skeleton-line" />
            ) : (
              <span className="stat-value">{elevatedAccess}</span>
            )}
          </div>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}

      <motion.section
        id="create-personal-robot"
        className="card create-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="card-header">
          <div>
            <span className="eyebrow">Personal unit</span>
            <h2>Create a personal robot</h2>
            <p>Serial numbers must remain unique across your entire fleet.</p>
          </div>
          <span className="badge badge-personal">Personal</span>
        </header>
        <form className="card-body form-grid" onSubmit={handleCreateRobot}>
          {createError && <div className="alert alert-error">{createError}</div>}
          <label htmlFor="robot-name">Name</label>
          <input
            id="robot-name"
            value={newRobotName}
            onChange={(event) => setNewRobotName(event.target.value)}
            required
            placeholder="Robot name"
          />

          <label htmlFor="robot-serial">Serial number</label>
          <input
            id="robot-serial"
            value={newRobotSerial}
            onChange={(event) => setNewRobotSerial(event.target.value)}
            required
            placeholder="Unique serial number"
          />

          <label htmlFor="robot-model">Model (optional)</label>
          <input
            id="robot-model"
            value={newRobotModel}
            onChange={(event) => setNewRobotModel(event.target.value)}
            placeholder="e.g., XR-200"
          />
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Commissioning…' : 'Create robot'}
          </button>
        </form>
      </motion.section>

      <div className="card-grid">
        <AnimatePresence initial={false}>
          {loading
            ? skeletonSlots.map((_, index) => (
                <motion.article
                  key={`skeleton-${index}`}
                  className="card robot-card skeleton-card"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line" style={{ width: '65%' }} />
                  <div className="skeleton-line" style={{ width: '45%' }} />
                  <div className="skeleton-line" style={{ width: '80%' }} />
                </motion.article>
              ))
            : robots.map((robot, index) => (
                <motion.article
                  key={robot.id}
                  className="card robot-card"
                  layout
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <header className="robot-card-header">
                    <div>
                      <span className="robot-sn">#{robot.serial_number}</span>
                      <h2>{robot.name}</h2>
                    </div>
                    <span className={`badge badge-${robot.ownership_type}`}>
                      {robot.ownership_type}
                    </span>
                  </header>
                  <div className="robot-card-body">
                    {robot.model && (
                      <div className="robot-meta">
                        <span className="robot-meta-label">Model</span>
                        <span className="robot-meta-value">{robot.model}</span>
                      </div>
                    )}
                    <div className="robot-meta">
                      <span className="robot-meta-label">Access</span>
                      <span className={`badge badge-permission-${robot.permission_level}`}>
                        {robot.permission_level}
                      </span>
                    </div>
                    {robot.owner_type === 'group' && robot.owner_group_id && (
                      <div className="robot-meta">
                        <span className="robot-meta-label">Owned by</span>
                        <span className="robot-meta-value">Group #{robot.owner_group_id}</span>
                      </div>
                    )}
                  </div>
                  <footer className="robot-card-footer">
                    <Link to={`/robots/${robot.serial_number}`} className="btn-ghost">
                      View robot
                    </Link>
                    <motion.span
                      className="orbit-indicator"
                      initial={{ opacity: 0, rotate: -15 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: index * 0.04 + 0.2, duration: 0.45 }}
                    />
                  </footer>
                </motion.article>
              ))}
        </AnimatePresence>
      </div>

      {!loading && robots.length === 0 && (
        <motion.p
          className="empty-state"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          You have no robots yet. Create one to get started.
        </motion.p>
      )}
    </div>
  );
};

export default Dashboard;

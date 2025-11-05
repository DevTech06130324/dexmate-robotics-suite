import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [newRobotName, setNewRobotName] = useState('');
  const [newRobotSerial, setNewRobotSerial] = useState('');
  const [newRobotModel, setNewRobotModel] = useState('');

  useEffect(() => {
    const fetchRobots = async () => {
      try {
        setLoading(true);
        const data = await listRobots();
        setRobots(data);
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
      await createRobot({
        name: newRobotName.trim(),
        serialNumber: newRobotSerial.trim(),
        model: newRobotModel.trim() || undefined,
        ownerType: 'user',
      });
      setNewRobotName('');
      setNewRobotSerial('');
      setNewRobotModel('');
      await refreshRobots();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error ?? 'Unable to create robot.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="page">Loading robots...</div>;
  }

  if (error) {
    return <div className="page error">{error}</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Welcome back, {user?.name ?? 'Operator'}</h1>
        <p>Your accessible robots</p>
      </header>

      <section className="card">
        <header className="card-header">
          <h2>Create a personal robot</h2>
        </header>
        <form className="card-body" onSubmit={handleCreateRobot}>
          {createError && <div className="alert alert-error">{createError}</div>}
          <div className="form-grid">
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
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create robot'}
          </button>
        </form>
      </section>

      <div className="card-grid">
        {robots.map((robot) => (
          <article key={robot.id} className="card">
            <header className="card-header">
              <h2>{robot.name}</h2>
              <span className={`badge badge-${robot.ownership_type}`}>
                {robot.ownership_type}
              </span>
            </header>
            <dl className="card-body">
              <div className="card-row">
                <dt>S/N</dt>
                <dd>{robot.serial_number}</dd>
              </div>
              {robot.model && (
                <div className="card-row">
                  <dt>Model</dt>
                  <dd>{robot.model}</dd>
                </div>
              )}
              <div className="card-row">
                <dt>Access</dt>
                <dd className={`badge badge-permission-${robot.permission_level}`}>
                  {robot.permission_level}
                </dd>
              </div>
            </dl>
            <footer className="card-footer">
              <Link to={`/robots/${robot.serial_number}`} className="btn-primary">
                View robot
              </Link>
            </footer>
          </article>
        ))}
      </div>

      {robots.length === 0 && <p>You have no robots yet. Create one to get started.</p>}
    </div>
  );
};

export default Dashboard;

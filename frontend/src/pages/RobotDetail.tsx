import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getRobotBySerial,
  grantRobotPermission,
  revokeRobotPermission,
  listRobotPermissions,
} from '../services/robots';
import { listGroupMembers } from '../services/groups';
import { loadSettings, saveSettings } from '../services/settings';
import { RobotDetails, RobotPermission, RobotSettings, SettingsPayload, GroupMember } from '../types';
import { useAuthContext } from '../contexts/AuthContext';

const RobotDetailPage: React.FC = () => {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const { user } = useAuthContext();
  const [robot, setRobot] = useState<RobotDetails | null>(null);
  const [settings, setSettings] = useState<SettingsPayload>({});
  const [currentSettings, setCurrentSettings] = useState<RobotSettings | null>(null);
  const [permissions, setPermissions] = useState<RobotPermission[]>([]);
  const [teamMembers, setTeamMembers] = useState<GroupMember[]>([]);
  const [newPermissionEmail, setNewPermissionEmail] = useState('');
  const [newPermissionLevel, setNewPermissionLevel] = useState<RobotPermission['permission_type']>('usage');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => {
    if (!robot || !user) return false;
    if (robot.owner_type === 'user' && robot.owner_user_id === user.id) return true;
    return permissions.some((permission) => permission.user_id === user.id && permission.permission_type === 'admin');
  }, [permissions, robot, user]);

  useEffect(() => {
    const loadRobot = async () => {
      if (!serialNumber) return;
      setLoading(true);
      setStatusMessage(null);
      setErrorMessage(null);

      try {
        const robotData = await getRobotBySerial(serialNumber);
        setRobot(robotData);

        const settingsData = await loadSettings(serialNumber).catch(() => null);
        if (settingsData) {
          setCurrentSettings(settingsData);
          setSettings(settingsData.settings ?? {});
        }

        const permissionList = await listRobotPermissions(serialNumber);
        setPermissions(permissionList);

        if (robotData.owner_type === 'group' && robotData.owner_group_id) {
          const members = await listGroupMembers(robotData.owner_group_id);
          setTeamMembers(members);
        }
      } catch (error) {
        setErrorMessage('Failed to load robot details.');
      } finally {
        setLoading(false);
      }
    };

    loadRobot();
  }, [serialNumber]);

  const handleSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serialNumber) return;

    try {
      const updated = await saveSettings(serialNumber, settings);
      setCurrentSettings(updated);
      setStatusMessage('Settings saved successfully.');
    } catch (error) {
      setErrorMessage('Failed to save settings.');
    }
  };

  const reloadPermissions = async () => {
    if (!serialNumber) return;
    const permissionList = await listRobotPermissions(serialNumber);
    setPermissions(permissionList);
  };

  const handleGrantPermission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!robot) return;

    try {
      await grantRobotPermission(robot.id, {
        userEmail: newPermissionEmail,
        permissionType: newPermissionLevel,
      });
      setStatusMessage('Permission updated.');
      setNewPermissionEmail('');
      await reloadPermissions();
    } catch (error) {
      setErrorMessage('Failed to update permission.');
    }
  };

  const handleRevokePermission = async (permission: RobotPermission) => {
    if (!robot) return;

    try {
      await revokeRobotPermission(robot.id, permission.user_id);
      setStatusMessage('Permission revoked.');
      await reloadPermissions();
    } catch (error) {
      setErrorMessage('Failed to revoke permission.');
    }
  };

  if (loading) {
    return <div className="page">Loading robot details…</div>;
  }

  if (!robot) {
    return <div className="page">Robot not found.</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{robot.name}</h1>
          <p>S/N: {robot.serial_number}</p>
        </div>
        <div className="page-actions">
          <span className={`badge badge-${robot.owner_type === 'user' ? 'personal' : 'group'}`}>
            {robot.owner_type === 'user' ? 'Personal' : 'Group-owned'}
          </span>
        </div>
      </header>

      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

      <section className="card">
        <header className="card-header">
          <h2>Your settings</h2>
        </header>
        <form className="card-body" onSubmit={handleSaveSettings}>
          <div className="form-grid">
            <label htmlFor="settings-theme">Theme</label>
            <input
              id="settings-theme"
              name="theme"
              value={(settings.theme as string) ?? ''}
              onChange={handleSettingsChange}
              placeholder="e.g., dark"
            />

            <label htmlFor="settings-language">Language</label>
            <input
              id="settings-language"
              name="language"
              value={(settings.language as string) ?? ''}
              onChange={handleSettingsChange}
              placeholder="e.g., en-US"
            />

            <label htmlFor="settings-custom">Custom parameter</label>
            <input
              id="settings-custom"
              name="custom"
              value={(settings.custom as string) ?? ''}
              onChange={handleSettingsChange}
              placeholder="Any value"
            />
          </div>
          <button type="submit" className="btn-primary">
            Save settings
          </button>
          {currentSettings && <p className="hint">Last saved: {new Date(currentSettings.updated_at ?? '').toLocaleString()}</p>}
        </form>
      </section>

      {isAdmin && (
        <section className="card">
          <header className="card-header">
            <h2>Manage permissions</h2>
          </header>
          <div className="card-body">
            <form className="permission-form" onSubmit={handleGrantPermission}>
              <div className="form-group">
                <label htmlFor="permission-email">User email</label>
                <input
                  id="permission-email"
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newPermissionEmail}
                  onChange={(event) => setNewPermissionEmail(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="permission-level">Permission</label>
                <select
                  id="permission-level"
                  value={newPermissionLevel}
                  onChange={(event) => setNewPermissionLevel(event.target.value as RobotPermission['permission_type'])}
                >
                  <option value="usage">Usage</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">
                Grant access
              </button>
            </form>

            <div className="permission-list">
              {permissions.map((permission) => (
                <div key={permission.user_id} className="permission-row">
                  <div>
                    <strong>{permission.name ?? permission.email}</strong>
                    <span className={`badge badge-permission-${permission.permission_type}`}>
                      {permission.permission_type}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleRevokePermission(permission)}
                    disabled={permission.user_id === user?.id}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {robot.owner_type === 'group' && teamMembers.length > 0 && (
        <section className="card">
          <header className="card-header">
            <h2>Group members</h2>
          </header>
          <ul className="card-body list">
            {teamMembers.map((member) => (
              <li key={member.user_id}>
                <strong>{member.name}</strong> — {member.email} ({member.role})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default RobotDetailPage;

import React, { useEffect, useMemo, useState } from 'react';
import { createGroup, listGroupMembers, listGroups, addOrUpdateGroupMember, removeGroupMember } from '../services/groups';
import { assignRobotToMember, createRobot, listRobots } from '../services/robots';
import { Group, GroupMember, Robot } from '../types';
import { useAuthContext } from '../contexts/AuthContext';

const GroupsPage: React.FC = () => {
  const { user } = useAuthContext();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupRobots, setGroupRobots] = useState<Robot[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<GroupMember['role']>('member');
  const [assignUserId, setAssignUserId] = useState<number | ''>('');
  const [assignRobotId, setAssignRobotId] = useState<number | ''>('');
  const [assignPermission, setAssignPermission] = useState<'usage' | 'admin'>('usage');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingRobot, setCreatingRobot] = useState(false);
  const [newRobotName, setNewRobotName] = useState('');
  const [newRobotSerial, setNewRobotSerial] = useState('');
  const [newRobotModel, setNewRobotModel] = useState('');

  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId), [groups, selectedGroupId]);

  const canManage = selectedGroup?.role === 'admin';

  const refreshGroups = async () => {
    setLoading(true);
    try {
      const data = await listGroups();
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      setErrorMessage('Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  const refreshMembers = async (groupId: number) => {
    try {
      const memberList = await listGroupMembers(groupId);
      setMembers(memberList);
    } catch (error) {
      setErrorMessage('Failed to load group members.');
    }
  };

  const refreshGroupRobots = async (groupId: number) => {
    try {
      const robots = await listRobots();
      const filtered = robots.filter((robot) => robot.owner_type === 'group' && robot.owner_group_id === groupId);
      setGroupRobots(filtered);
    } catch (error) {
      setErrorMessage('Failed to load group robots.');
    }
  };

  useEffect(() => {
    refreshGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      refreshMembers(selectedGroupId);
      refreshGroupRobots(selectedGroupId);
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [selectedGroupId]);

  const handleCreateGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const group = await createGroup(newGroupName.trim());
      setNewGroupName('');
      setStatusMessage(`Created group ${group.name}.`);
      await refreshGroups();
      setSelectedGroupId(group.id);
    } catch (error) {
      setErrorMessage('Unable to create group.');
    }
  };

  const handleInviteMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGroupId || !inviteEmail.trim()) return;

    try {
      await addOrUpdateGroupMember(selectedGroupId, {
        userEmail: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail('');
      setStatusMessage('Member added or updated.');
      await refreshMembers(selectedGroupId);
    } catch (error) {
      setErrorMessage('Failed to invite member. Ensure the user exists.');
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!selectedGroupId) return;
    if (member.user_id === user?.id) {
      setErrorMessage('You cannot remove yourself.');
      return;
    }

    try {
      await removeGroupMember(selectedGroupId, member.user_id);
      setStatusMessage('Member removed.');
      await refreshMembers(selectedGroupId);
    } catch (error) {
      setErrorMessage('Failed to remove member.');
    }
  };

  const handleAssignRobot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGroupId || !assignRobotId || !assignUserId) return;

    try {
      await assignRobotToMember(Number(assignRobotId), {
        userId: Number(assignUserId),
        permissionType: assignPermission,
      });
      setAssignRobotId('');
      setAssignUserId('');
      setStatusMessage('Robot assigned successfully.');
    } catch (error) {
      setErrorMessage('Failed to assign robot.');
    }
  };

  const handleCreateGroupRobot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGroupId || !newRobotName.trim() || !newRobotSerial.trim()) {
      setErrorMessage('Robot name and serial number are required.');
      return;
    }

    try {
      setCreatingRobot(true);
      setErrorMessage(null);
      await createRobot({
        name: newRobotName.trim(),
        serialNumber: newRobotSerial.trim(),
        model: newRobotModel.trim() || undefined,
        ownerType: 'group',
        ownerGroupId: selectedGroupId,
      });
      setStatusMessage('Group robot created.');
      setNewRobotName('');
      setNewRobotSerial('');
      setNewRobotModel('');
      await refreshGroupRobots(selectedGroupId);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.error ?? 'Failed to create robot.');
    } finally {
      setCreatingRobot(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Groups</h1>
        <p>Manage collaborative access for group-owned robots.</p>
      </header>

      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

      <div className="layout-grid">
        <section className="card">
          <header className="card-header">
            <h2>Your groups</h2>
          </header>
          <div className="card-body group-list">
            {loading ? (
              <p>Loading groups…</p>
            ) : groups.length === 0 ? (
              <p>You do not belong to any groups yet.</p>
            ) : (
              <ul>
                {groups.map((group) => (
                  <li key={group.id}>
                    <button
                      type="button"
                      className={`group-item ${group.id === selectedGroupId ? 'active' : ''}`}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <span className="group-name">{group.name}</span>
                      <span className={`badge ${group.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                        {group.role}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="card-footer">
            <form onSubmit={handleCreateGroup} className="inline-form">
              <input
                type="text"
                placeholder="New group name"
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
              />
              <button type="submit" className="btn-primary">
                Create group
              </button>
            </form>
          </footer>
        </section>

        {selectedGroup ? (
          <section className="card">
            <header className="card-header">
              <div>
                <h2>{selectedGroup.name}</h2>
                <p>Members</p>
              </div>
            </header>
            <div className="card-body">
              {members.length === 0 ? (
                <p>No members yet.</p>
              ) : (
                <ul className="list">
                  {members.map((member) => (
                    <li key={member.user_id} className="member-row">
                      <div>
                        <strong>{member.name}</strong>
                        <div className="member-meta">
                          <span>{member.email}</span>
                          <span className={`badge ${member.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      {canManage && (
                        <div className="member-actions">
                          <select
                            value={member.role}
                            onChange={async (event) => {
                              try {
                                await addOrUpdateGroupMember(selectedGroup.id, {
                                  userId: member.user_id,
                                  role: event.target.value as GroupMember['role'],
                                });
                                setStatusMessage('Member role updated.');
                                await refreshMembers(selectedGroup.id);
                              } catch (error) {
                                setErrorMessage('Failed to update role.');
                              }
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleRemoveMember(member)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canManage && (
              <footer className="card-footer">
                <form onSubmit={handleInviteMember} className="inline-form">
                  <input
                    type="email"
                    placeholder="Invite by email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    required
                  />
                  <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as GroupMember['role'])}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="btn-primary">
                    Invite
                  </button>
                </form>
              </footer>
            )}
          </section>
        ) : (
          <section className="card">
            <header className="card-header">
              <h2>Select a group</h2>
            </header>
            <div className="card-body">
              <p>Choose a group from the list to see its members.</p>
            </div>
          </section>
        )}
      </div>

      {canManage && selectedGroup && (
        <section className="card">
          <header className="card-header">
            <h2>Assign robots to members</h2>
          </header>
          <div className="card-body">
            <form className="card-body" onSubmit={handleCreateGroupRobot}>
              <h3>Create group-owned robot</h3>
              <div className="form-grid">
                <label htmlFor="group-robot-name">Name</label>
                <input
                  id="group-robot-name"
                  value={newRobotName}
                  onChange={(event) => setNewRobotName(event.target.value)}
                  placeholder="Robot name"
                  required
                />

                <label htmlFor="group-robot-serial">Serial number</label>
                <input
                  id="group-robot-serial"
                  value={newRobotSerial}
                  onChange={(event) => setNewRobotSerial(event.target.value)}
                  placeholder="Unique serial"
                  required
                />

                <label htmlFor="group-robot-model">Model (optional)</label>
                <input
                  id="group-robot-model"
                  value={newRobotModel}
                  onChange={(event) => setNewRobotModel(event.target.value)}
                  placeholder="e.g., XR-200"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={creatingRobot}>
                {creatingRobot ? 'Creating…' : 'Create robot'}
              </button>
            </form>

            {groupRobots.length === 0 ? (
              <p className="hint">No group-owned robots yet.</p>
            ) : (
              <form className="assignment-form" onSubmit={handleAssignRobot}>
                <select
                  value={assignRobotId}
                  onChange={(event) => setAssignRobotId(event.target.value ? Number(event.target.value) : '')}
                  required
                >
                  <option value="">Select robot</option>
                  {groupRobots.map((robot) => (
                    <option key={robot.id} value={robot.id}>
                      {robot.name} — {robot.serial_number}
                    </option>
                  ))}
                </select>
                <select
                  value={assignUserId}
                  onChange={(event) => setAssignUserId(event.target.value ? Number(event.target.value) : '')}
                  required
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <select value={assignPermission} onChange={(event) => setAssignPermission(event.target.value as 'usage' | 'admin')}>
                  <option value="usage">Usage</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn-primary">
                  Assign robot
                </button>
              </form>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default GroupsPage;

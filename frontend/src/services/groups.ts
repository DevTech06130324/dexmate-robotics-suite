import api from './api';
import { Group, GroupMember } from '../types';

export const listGroups = async (): Promise<Group[]> => {
  const response = await api.get<Group[]>('/groups');
  return response.data;
};

export const listGroupMembers = async (groupId: number): Promise<GroupMember[]> => {
  const response = await api.get<GroupMember[]>(`/groups/${groupId}/members`);
  return response.data;
};

export const addOrUpdateGroupMember = async (
  groupId: number,
  payload: { userId?: number; userEmail?: string; role: GroupMember['role'] },
): Promise<GroupMember> => {
  const response = await api.post<GroupMember>(`/groups/${groupId}/members`, payload);
  return response.data;
};

export const removeGroupMember = async (groupId: number, userId: number): Promise<void> => {
  await api.delete(`/groups/${groupId}/members/${userId}`);
};

export const createGroup = async (name: string): Promise<Group> => {
  const response = await api.post<Group>('/groups', { name });
  return response.data;
};

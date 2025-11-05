import api from './api';
import { Robot, RobotDetails, RobotPermission } from '../types';

export const listRobots = async (): Promise<Robot[]> => {
  const response = await api.get<Robot[]>('/robots');
  return response.data;
};

export const getRobotBySerial = async (serialNumber: string): Promise<RobotDetails> => {
  const response = await api.get<RobotDetails>(`/robots/${serialNumber}`);
  return response.data;
};

type PermissionType = RobotPermission['permission_type'];

interface PermissionPayload {
  userId?: number;
  userEmail?: string;
  permissionType: PermissionType;
}

const buildPermissionRequestBody = (payload: PermissionPayload) => ({
  user_id: payload.userId,
  user_email: payload.userEmail,
  permission_type: payload.permissionType,
});

export const grantRobotPermission = async (robotId: number, payload: PermissionPayload): Promise<RobotPermission> => {
  const response = await api.post<RobotPermission>(`/robots/${robotId}/permissions`, buildPermissionRequestBody(payload));
  return response.data;
};

export const revokeRobotPermission = async (robotId: number, userId: number): Promise<void> => {
  await api.delete(`/robots/${robotId}/permissions/${userId}`);
};

export const listRobotPermissions = async (serialNumber: string): Promise<RobotPermission[]> => {
  const response = await api.get<RobotPermission[]>(`/robots/${serialNumber}/permissions`);
  return response.data;
};

export const assignRobotToMember = async (robotId: number, payload: PermissionPayload): Promise<RobotPermission> => {
  const response = await api.post<RobotPermission>(`/robots/${robotId}/assign`, buildPermissionRequestBody(payload));
  return response.data;
};

interface CreateRobotPayload {
  serialNumber: string;
  name: string;
  model?: string;
  ownerType: 'user' | 'group';
  ownerGroupId?: number;
}

export const createRobot = async (payload: CreateRobotPayload): Promise<RobotDetails> => {
  const response = await api.post<RobotDetails>('/robots', {
    serial_number: payload.serialNumber,
    name: payload.name,
    model: payload.model,
    owner_type: payload.ownerType,
    owner_group_id: payload.ownerGroupId,
  });
  return response.data;
};

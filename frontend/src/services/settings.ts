import api from './api';
import { RobotSettings } from '../types';

export const loadSettings = async (serialNumber: string): Promise<RobotSettings> => {
  const response = await api.get<RobotSettings>(`/settings/${serialNumber}`);
  return response.data;
};

export const saveSettings = async (serialNumber: string, settings: Record<string, unknown>): Promise<RobotSettings> => {
  const response = await api.post<RobotSettings>(`/settings/${serialNumber}`, {
    settings,
  });
  return response.data;
};

export const listUserSettings = async (): Promise<RobotSettings[]> => {
  const response = await api.get<RobotSettings[]>('/settings/user/all');
  return response.data;
};

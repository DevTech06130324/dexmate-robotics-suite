import api from './api';
import { User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const loginRequest = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
};

export const registerRequest = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
  return response.data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/users/me');
  return response.data;
};

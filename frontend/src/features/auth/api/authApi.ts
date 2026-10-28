import apiClient from '../../../api/client.ts';
import type {
  AuthResponse,
  MeResponse,
  LoginCredentials,
  RegisterCredentials,
} from '../types.ts';

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return await apiClient.post<AuthResponse>('/auth/login', credentials);
};

export const registerApi = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  return await apiClient.post<AuthResponse>('/auth/register', credentials);
};

export const getMeApi = async (): Promise<MeResponse> => {
  return await apiClient.get<MeResponse>('/auth/me');
};


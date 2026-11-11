import { apiRequest } from './client';
import type { User, HealthResponse } from '../types';

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function meApi(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/me');
}

export async function logoutApi(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export async function changePasswordApi(payload: ChangePasswordPayload): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function checkHealthApi(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health');
}

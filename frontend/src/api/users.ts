import { apiRequest } from './client';

export interface UserItem {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface GetUsersResponse {
  users: UserItem[];
  can_add_users?: boolean;
  admin_email?: string;
}

export async function getUsersApi(): Promise<GetUsersResponse> {
  return apiRequest<GetUsersResponse>('/users');
}

export async function createUserApi(payload: CreateUserPayload): Promise<{ message: string; user: UserItem }> {
  return apiRequest<{ message: string; user: UserItem }>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


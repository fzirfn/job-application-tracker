import { apiRequest, API_BASE } from './client';
import type { Application, ApplicationStatus } from '../types';

export interface ApplicationFilterParams {
  search?: string;
  status?: string;
  source?: string;
  company_id?: number | string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface PaginatedApplications {
  data: Application[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export async function getApplicationsApi(
  params: ApplicationFilterParams = {}
): Promise<PaginatedApplications> {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.source) query.set('source', params.source);
  if (params.company_id) query.set('company_id', String(params.company_id));
  if (params.date_from) query.set('date_from', params.date_from);
  if (params.date_to) query.set('date_to', params.date_to);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.sort_order) query.set('sort_order', params.sort_order);
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));

  const qs = query.toString();
  return apiRequest<PaginatedApplications>(`/applications${qs ? `?${qs}` : ''}`);
}

export async function getApplicationApi(id: number): Promise<{ application: Application }> {
  return apiRequest<{ application: Application }>(`/applications/${id}`);
}

export interface CreateApplicationPayload {
  company_name: string;
  company_id?: number | null;
  company_website?: string | null;
  company_industry?: string | null;
  company_size?: string | null;
  job_title: string;
  job_url?: string | null;
  source: string;
  date_applied: string;
  location?: string | null;
  job_description?: string | null;
  screenshot_path?: string | null;
  status: ApplicationStatus;
  follow_up_date?: string | null;
  notes?: string | null;
}

export async function createApplicationApi(
  payload: CreateApplicationPayload
): Promise<{ message: string; application: Application }> {
  return apiRequest<{ message: string; application: Application }>('/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateApplicationApi(
  id: number,
  payload: Partial<CreateApplicationPayload>
): Promise<{ message: string; application: Application }> {
  return apiRequest<{ message: string; application: Application }>(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateApplicationStatusApi(
  id: number,
  status: ApplicationStatus
): Promise<{ message: string; application: Application }> {
  return apiRequest<{ message: string; application: Application }>(`/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteApplicationApi(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/applications/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadScreenshotApi(
  file: File
): Promise<{ message: string; path: string; url: string }> {
  const formData = new FormData();
  formData.append('screenshot', file);

  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/applications/upload-screenshot`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Screenshot upload failed');
  }

  return response.json();
}


import { apiRequest, API_BASE } from './client';
import type { Document } from '../types';

export async function uploadDocumentApi(
  applicationId: number,
  kind: 'cv' | 'cover_letter',
  file: File
): Promise<{ message: string; document: Document }> {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('document', file);

  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/applications/${applicationId}/documents`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Document upload failed');
  }

  return response.json();
}

export async function deleteDocumentApi(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/documents/${id}`, {
    method: 'DELETE',
  });
}


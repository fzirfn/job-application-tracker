import { apiRequest } from './client';
import type { Contact } from '../types';

export interface CreateContactPayload {
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
}

export async function createContactApi(
  applicationId: number,
  payload: CreateContactPayload
): Promise<{ message: string; contact: Contact }> {
  return apiRequest<{ message: string; contact: Contact }>(
    `/applications/${applicationId}/contacts`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function updateContactApi(
  id: number,
  payload: Partial<CreateContactPayload>
): Promise<{ message: string; contact: Contact }> {
  return apiRequest<{ message: string; contact: Contact }>(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteContactApi(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/contacts/${id}`, {
    method: 'DELETE',
  });
}


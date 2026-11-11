import { apiRequest } from './client';
import type { Interview } from '../types';

export interface CreateInterviewPayload {
  interview_type: string;
  scheduled_at: string;
  interviewer?: string | null;
  link_or_location?: string | null;
  prep_notes?: string | null;
  result_notes?: string | null;
}

export async function createInterviewApi(
  applicationId: number,
  payload: CreateInterviewPayload
): Promise<{ message: string; interview: Interview }> {
  return apiRequest<{ message: string; interview: Interview }>(
    `/applications/${applicationId}/interviews`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function updateInterviewApi(
  id: number,
  payload: Partial<CreateInterviewPayload>
): Promise<{ message: string; interview: Interview }> {
  return apiRequest<{ message: string; interview: Interview }>(`/interviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteInterviewApi(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/interviews/${id}`, {
    method: 'DELETE',
  });
}


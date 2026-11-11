import { apiRequest } from './client';

export interface AppSettingsData {
  sources: string[];
  reminder_days: number;
  default_location: string;
}

export async function getSettingsApi(): Promise<AppSettingsData> {
  return apiRequest<AppSettingsData>('/settings');
}

export async function updateSettingsApi(payload: Partial<AppSettingsData>): Promise<AppSettingsData> {
  return apiRequest<AppSettingsData>('/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}


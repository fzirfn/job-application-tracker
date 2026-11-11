import { apiRequest } from './client';
import type { Application, Interview } from '../types';

export interface DashboardSummaryResponse {
  status_counts: Record<string, number>;
  total_applications: number;
  this_week: {
    count: number;
    applications: Application[];
    start_of_week: string;
    end_of_week: string;
  };
  upcoming_interviews: Interview[];
  today_interviews: Interview[];
  overdue_follow_ups: Application[];
  stale_applications: Application[];
  reminder_days: number;
  current_time: string;
}

export async function getDashboardSummaryApi(): Promise<DashboardSummaryResponse> {
  return apiRequest<DashboardSummaryResponse>('/dashboard/summary');
}


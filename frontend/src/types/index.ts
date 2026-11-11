export interface User {
  id: number;
  name: string;
  email: string;
}

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Technical Test'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Ghosted'
  | 'Withdrawn';

export interface Company {
  id: number;
  name: string;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StatusHistory {
  id: number;
  application_id: number;
  from_status?: string | null;
  to_status: ApplicationStatus;
  changed_at: string;
  created_at?: string;
}

export interface Interview {
  id: number;
  application_id: number;
  application?: Application;
  interview_type: string;
  scheduled_at: string;
  interviewer?: string | null;
  link_or_location?: string | null;
  prep_notes?: string | null;
  result_notes?: string | null;
  created_at?: string;
}

export interface Contact {
  id: number;
  application_id: number;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
}

export interface Document {
  id: number;
  application_id: number;
  kind: 'cv' | 'cover_letter';
  file_name: string;
  file_path: string;
  url?: string | null;
  created_at?: string;
}

export interface Application {
  id: number;
  company_id: number;
  company?: Company;
  job_title: string;
  job_url?: string | null;
  source: string;
  date_applied: string;
  location: string;
  job_description?: string | null;
  screenshot_path?: string | null;
  screenshot_url?: string | null;
  status: ApplicationStatus;
  follow_up_date?: string | null;
  notes?: string | null;
  status_history?: StatusHistory[];
  interviews?: Interview[];
  contacts?: Contact[];
  documents?: Document[];
  created_at?: string;
  updated_at?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  api: string;
  database: {
    connected: boolean;
    connection: string;
    error?: string | null;
  };
  timezone: string;
  timestamp: string;
}


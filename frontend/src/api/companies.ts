import { apiRequest } from './client';
import type { Company } from '../types';

export interface CompanyLookupResponse {
  found: boolean;
  source: 'database' | 'ai' | 'none';
  company: {
    id?: number;
    name: string;
    website?: string | null;
    industry?: string | null;
    size?: string | null;
    location?: string | null;
    logo_url?: string | null;
  };
  message?: string;
}

export async function getCompaniesApi(search?: string): Promise<{ companies: Company[] }> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<{ companies: Company[] }>(`/companies${query}`);
}

export async function lookupCompanyApi(name: string): Promise<CompanyLookupResponse> {
  return apiRequest<CompanyLookupResponse>('/companies/lookup', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

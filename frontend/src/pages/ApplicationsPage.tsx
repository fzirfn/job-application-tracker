import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Application, ApplicationStatus } from '../types';
import {
  getApplicationsApi,
  createApplicationApi,
  updateApplicationApi,
  updateApplicationStatusApi,
  deleteApplicationApi,
  type ApplicationFilterParams,
  type CreateApplicationPayload,
} from '../api/applications';
import { getSettingsApi } from '../api/settings';
import { formatDateMY } from '../utils/date';
import { StatusSelector } from '../components/ui/StatusSelector';
import { ALL_STATUSES } from '../components/ui/StatusBadge';
import { CompanyAvatar } from '../components/ui/CompanyAvatar';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal';
import { StatusHistoryModal } from '../components/applications/StatusHistoryModal';
import { ScreenshotModal } from '../components/applications/ScreenshotModal';
import {
  Search,
  Plus,
  ExternalLink,
  History,
  Image as ImageIcon,
  Edit2,
  Trash2,
  X,
  FilterX,
  Eye
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [sourcesList, setSourcesList] = useState<string[]>([
    'JobStreet',
    'LinkedIn',
    'MyFutureJobs',
    'MauKerja',
    'TechStreet',
    'Hiredly',
    'Indeed',
    'Company Site',
    'Email',
    'Referral',
    'Other',
  ]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [historyModalApp, setHistoryModalApp] = useState<Application | null>(null);
  const [screenshotModalData, setScreenshotModalData] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Sync url param if changed externally
  useEffect(() => {
    const st = searchParams.get('status');
    if (st !== null) {
      setSelectedStatus(st);
    }
  }, [searchParams]);

  // Load Settings (Sources)
  useEffect(() => {
    getSettingsApi()
      .then((res) => {
        if (res.sources && res.sources.length > 0) {
          setSourcesList(res.sources);
        }
      })
      .catch((err) => console.warn('Could not load settings:', err));
  }, []);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ApplicationFilterParams = {
        search: search.trim() || undefined,
        status: selectedStatus || undefined,
        source: selectedSource || undefined,
        sort_by: 'date_applied',
        sort_order: 'desc',
        per_page: 100,
      };

      const res = await getApplicationsApi(params);
      setApplications(res.data);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStatus, selectedSource]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  // Handle stage change
  const handleStatusChange = async (appId: number, newStatus: ApplicationStatus) => {
    try {
      const res = await updateApplicationStatusApi(appId, newStatus);
      // Update local state with the returned application including updated status_history
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? res.application : app))
      );
    } catch (err) {
      console.error('Failed to update stage:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Handle form submit (Create or Edit)
  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    if (editingApplication) {
      await updateApplicationApi(editingApplication.id, formData as Partial<CreateApplicationPayload>);
    } else {
      await createApplicationApi(formData as unknown as CreateApplicationPayload);
    }
    await fetchApplications();
  };

  // Handle delete
  const handleDelete = async (app: Application) => {
    if (!window.confirm(`Delete application for "${app.job_title}" at ${app.company?.name}?`)) {
      return;
    }

    try {
      await deleteApplicationApi(app.id);
      setApplications((prev) => prev.filter((item) => item.id !== app.id));
      setTotalCount((prev) => prev - 1);
    } catch (err) {
      console.error('Failed to delete application:', err);
      alert('Failed to delete application.');
    }
  };

  const hasActiveFilters = Boolean(search || selectedStatus || selectedSource);

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedSource('');
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
              Applications Journal
            </h1>
            <span className="px-2.5 py-0.5 rounded-[6px] bg-[#f1f5f9] text-[#0f766e] text-xs font-semibold tabular-nums border border-[#e2e8f0]">
              {totalCount} total
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Record, filter and advance your job applications with an automatic status audit log.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingApplication(null);
            setIsFormOpen(true);
          }}
          className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] text-xs font-medium flex items-center gap-1.5 self-start cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Record application</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#ffffff] border border-[#e2e8f0] rounded-[10px] flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, job title or notes..."
            className="w-full h-9 pl-9 pr-7 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#0f766e] focus:bg-[#ffffff] text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-44">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              if (e.target.value) {
                setSearchParams({ status: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
            className="w-full h-9 px-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] outline-none cursor-pointer"
          >
            <option value="">All pipeline stages</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div className="w-40">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full h-9 px-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] outline-none cursor-pointer"
          >
            <option value="">All job portals</option>
            {sourcesList.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filters button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:bg-[#f8fafc] text-xs text-[#64748b] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Applications Table */}
      <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-[10px] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#64748b]">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            {hasActiveFilters ? (
              <div className="space-y-3">
                <p className="text-xs text-[#64748b]">
                  No applications match your search or filter criteria.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#0f766e] text-[#ffffff] text-xs font-medium cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#64748b]">
                  No job applications recorded yet. Start tracking your applications!
                </p>
                <button
                  onClick={() => {
                    setEditingApplication(null);
                    setIsFormOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#0f766e] text-[#ffffff] text-xs font-medium cursor-pointer"
                >
                  Record first application
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] font-medium">
                  <th className="py-3 px-4 font-medium">Company</th>
                  <th className="py-3 px-4 font-medium">Job title</th>
                  <th className="py-3 px-4 font-medium">Portal</th>
                  <th className="py-3 px-4 font-medium">Applied</th>
                  <th className="py-3 px-4 font-medium">Stage</th>
                  <th className="py-3 px-3 font-medium text-center">Posting</th>
                  <th className="py-3 px-3 font-medium text-center">Audit</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-[#f8fafc] transition-colors group"
                  >
                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <CompanyAvatar name={app.company?.name || 'Company'} size="sm" />
                        <div>
                          <div className="font-semibold text-[#0f172a]">
                            {app.company?.name || 'Unknown company'}
                          </div>
                          <div className="text-[11px] text-[#64748b] flex items-center gap-1.5 mt-0.5">
                            <span>{app.location || 'Kuala Lumpur'}</span>
                            {app.company?.website && (
                              <>
                                <span>·</span>
                                <a
                                  href={app.company.website.startsWith('http') ? app.company.website : `https://${app.company.website}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#0f766e] hover:underline"
                                >
                                  website
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Job Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/applications/${app.id}`}
                          className="font-medium text-[#0f172a] hover:text-[#0f766e] transition-colors"
                        >
                          {app.job_title}
                        </Link>
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#94a3b8] hover:text-[#0f172a]"
                            title="Open original job posting"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {app.notes && (
                        <p className="text-[11px] text-[#64748b] truncate max-w-xs mt-0.5">
                          {app.notes}
                        </p>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-[6px] bg-[#f1f5f9] text-[#334155] text-[11px] font-medium border border-[#e2e8f0]">
                        {app.source}
                      </span>
                    </td>

                    {/* Date Applied */}
                    <td className="py-3.5 px-4 tabular-nums text-[#0f172a]">
                      {formatDateMY(app.date_applied)}
                    </td>

                    {/* Stage / Status Selector */}
                    <td className="py-3.5 px-4">
                      <StatusSelector
                        currentStatus={app.status}
                        onStatusChange={(newStatus) =>
                          handleStatusChange(app.id, newStatus)
                        }
                      />
                    </td>

                    {/* Screenshot attached indicator */}
                    <td className="py-3.5 px-3 text-center">
                      {app.screenshot_url || app.screenshot_path ? (
                        <button
                          type="button"
                          onClick={() =>
                            setScreenshotModalData({
                              url: app.screenshot_url || `/storage/${app.screenshot_path}`,
                              title: `${app.job_title} at ${app.company?.name}`,
                            })
                          }
                          className="p-1 rounded-[6px] text-[#0f766e] hover:bg-[#f0fdfa] transition-colors cursor-pointer"
                          title="View posting screenshot"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[#cbd5e1]">—</span>
                      )}
                    </td>

                    {/* History button */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setHistoryModalApp(app)}
                        className="p-1 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                        title="View stage history timeline"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/applications/${app.id}`}
                          className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f766e] hover:bg-[#f0fdfa] transition-colors cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingApplication(app);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                          title="Edit application"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(app)}
                          className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                          title="Delete application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Form Modal */}
      <ApplicationFormModal
        isOpen={isFormOpen}
        application={editingApplication}
        sourcesList={sourcesList}
        onClose={() => {
          setIsFormOpen(false);
          setEditingApplication(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Stage History Modal */}
      <StatusHistoryModal
        application={historyModalApp}
        onClose={() => setHistoryModalApp(null)}
      />

      {/* Screenshot Preview Modal */}
      <ScreenshotModal
        url={screenshotModalData?.url || null}
        title={screenshotModalData?.title || ''}
        onClose={() => setScreenshotModalData(null)}
      />
    </div>
  );
};

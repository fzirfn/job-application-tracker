import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummaryApi, type DashboardSummaryResponse } from '../api/dashboard';
import { formatDateMY, formatDateTimeMY } from '../utils/date';
import { STATUS_CONFIG } from '../components/ui/StatusBadge';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal';
import { CompanyAvatar } from '../components/ui/CompanyAvatar';
import { createApplicationApi, type CreateApplicationPayload } from '../api/applications';
import {
  Calendar,
  Layers,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  ChevronRight,
  KanbanSquare
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getDashboardSummaryApi();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleCreateApplication = async (formData: Record<string, unknown>) => {
    await createApplicationApi(formData as unknown as CreateApplicationPayload);
    await fetchSummary();
  };

  const todayActionsCount =
    (summary?.today_interviews?.length || 0) +
    (summary?.overdue_follow_ups?.length || 0) +
    (summary?.stale_applications?.length || 0);

  return (
    <div className="space-y-6">
      {/* Editorial Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-normal text-[#0f172a] tracking-tight italic">
            Good day, {user?.name || 'Job Seeker'}
          </h1>
          <p className="text-xs text-[#64748b]">
            Here is your active career pipeline and tasks requiring attention today across Malaysia.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFormOpen(true)}
            className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Record application</span>
          </button>
          <Link
            to="/kanban"
            className="h-9 px-3.5 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:border-[#0f766e] text-xs font-medium text-[#0f172a] flex items-center gap-1.5 transition-colors"
          >
            <KanbanSquare className="w-3.5 h-3.5 text-[#0f766e]" />
            <span>Kanban board</span>
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:border-[#0f766e] text-xs text-[#0f172a] flex items-center cursor-pointer transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b]">Total applications</div>
          <div className="text-3xl font-bold text-[#0f172a] mt-1.5 tabular-nums">
            {isLoading ? '...' : summary?.total_applications ?? 0}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">Across all pipeline stages</div>
        </div>

        <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b]">Sent this week</div>
          <div className="text-3xl font-bold text-[#0f766e] mt-1.5 tabular-nums">
            {isLoading ? '...' : summary?.this_week?.count ?? 0}
          </div>
          <div className="text-[11px] text-[#166534] mt-1">Activity this week</div>
        </div>

        <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b]">Upcoming interviews</div>
          <div className="text-3xl font-bold text-[#1e40af] mt-1.5 tabular-nums">
            {isLoading ? '...' : summary?.upcoming_interviews?.length ?? 0}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            {summary?.today_interviews?.length ? `${summary.today_interviews.length} scheduled today` : 'None scheduled today'}
          </div>
        </div>

        <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b]">Actions needed today</div>
          <div className="text-3xl font-bold mt-1.5 tabular-nums text-[#92400e]">
            {isLoading ? '...' : todayActionsCount}
          </div>
          <div className="text-[11px] text-[#92400e] mt-1">
            Follow-ups & stale alerts
          </div>
        </div>
      </div>

      {/* Status Pipeline Strip */}
      <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-[#f1f5f9] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0f172a]">Stage pipeline breakdown</span>
            <span className="text-[11px] text-[#64748b]">· click to filter list</span>
          </div>
          <Link to="/applications" className="text-[#0f766e] hover:underline flex items-center gap-1 font-medium">
            <span>View all in table</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {[
            'Saved',
            'Applied',
            'Screening',
            'Interview',
            'Technical Test',
            'Offer',
            'Final',
          ].map((stageName) => {
            const count =
              stageName === 'Final'
                ? (summary?.status_counts?.['Accepted'] || 0) +
                  (summary?.status_counts?.['Rejected'] || 0) +
                  (summary?.status_counts?.['Ghosted'] || 0) +
                  (summary?.status_counts?.['Withdrawn'] || 0)
                : summary?.status_counts?.[stageName] || 0;

            const cfg = STATUS_CONFIG[stageName] || {
              bg: 'bg-[#f8fafc]',
              text: 'text-[#334155]',
              border: 'border-[#cbd5e1]',
            };

            const targetUrl = stageName === 'Final' ? '/applications' : `/applications?status=${encodeURIComponent(stageName)}`;

            return (
              <Link
                key={stageName}
                to={targetUrl}
                className={`p-3 rounded-[8px] border ${cfg.bg} ${cfg.border} text-xs block hover:opacity-90 transition-opacity`}
              >
                <div className={`text-[11px] font-medium ${cfg.text}`}>{stageName}</div>
                <div className="text-xl font-bold text-[#0f172a] tabular-nums mt-1">
                  {count}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two-Column Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Overdue Follow-ups & Stale Applications */}
        <div className="space-y-6">
          {/* Overdue Follow-ups */}
          <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#92400e]" />
                <h2 className="text-xs font-semibold text-[#0f172a]">
                  Overdue follow-ups ({summary?.overdue_follow_ups?.length || 0})
                </h2>
              </div>
              <span className="text-[11px] text-[#92400e] font-medium bg-[#fef3c7] px-2 py-0.5 rounded-[4px] border border-[#fde68a]">
                Action needed
              </span>
            </div>

            {!summary?.overdue_follow_ups || summary.overdue_follow_ups.length === 0 ? (
              <p className="text-xs text-[#64748b] italic py-4 text-center">
                No overdue follow-ups. You are completely caught up!
              </p>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {summary.overdue_follow_ups.map((app) => (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyAvatar name={app.company?.name || 'Company'} size="md" />
                      <div className="truncate">
                        <Link
                          to={`/applications/${app.id}`}
                          className="font-medium text-[#0f172a] hover:text-[#0f766e] truncate block"
                        >
                          {app.job_title}
                        </Link>
                        <div className="text-[11px] text-[#64748b] mt-0.5">
                          {app.company?.name} · Follow-up was due on{' '}
                          <strong className="text-[#991b1b] tabular-nums font-semibold">
                            {formatDateMY(app.follow_up_date)}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/applications/${app.id}`}
                      className="px-2.5 py-1 rounded-[6px] bg-[#ffffff] border border-[#e2e8f0] hover:border-[#0f766e] text-[11px] font-medium text-[#0f172a] shrink-0 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stale Applications (> 7 days with no reply) */}
          <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#64748b]" />
                <h2 className="text-xs font-semibold text-[#0f172a]">
                  No reply for {summary?.reminder_days || 7}+ days ({summary?.stale_applications?.length || 0})
                </h2>
              </div>
              <span className="text-[11px] text-[#64748b]">Applied stage</span>
            </div>

            {!summary?.stale_applications || summary.stale_applications.length === 0 ? (
              <p className="text-xs text-[#64748b] italic py-4 text-center">
                No stale applications waiting for response.
              </p>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {summary.stale_applications.map((app) => (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyAvatar name={app.company?.name || 'Company'} size="md" />
                      <div className="truncate">
                        <Link
                          to={`/applications/${app.id}`}
                          className="font-medium text-[#0f172a] hover:text-[#0f766e] truncate block"
                        >
                          {app.job_title}
                        </Link>
                        <div className="text-[11px] text-[#64748b] mt-0.5">
                          {app.company?.name} · Applied on{' '}
                          <span className="tabular-nums font-medium text-[#0f172a]">
                            {formatDateMY(app.date_applied)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/applications/${app.id}`}
                      className="px-2.5 py-1 rounded-[6px] bg-[#ffffff] border border-[#e2e8f0] hover:border-[#0f766e] text-[11px] font-medium text-[#0f172a] shrink-0 transition-colors"
                    >
                      Follow up
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Interviews & Applications Sent This Week */}
        <div className="space-y-6">
          {/* Upcoming Interviews Card */}
          <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0f766e]" />
                <h2 className="text-xs font-semibold text-[#0f172a]">
                  Upcoming interviews ({summary?.upcoming_interviews?.length || 0})
                </h2>
              </div>
              <span className="text-[11px] text-[#0f766e] font-medium bg-[#f0fdfa] px-2 py-0.5 rounded-[4px] border border-[#ccfbf1]">
                Asia/KL
              </span>
            </div>

            {!summary?.upcoming_interviews || summary.upcoming_interviews.length === 0 ? (
              <p className="text-xs text-[#64748b] italic py-4 text-center">
                No upcoming interviews scheduled yet.
              </p>
            ) : (
              <div className="space-y-3">
                {summary.upcoming_interviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="p-3.5 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar name={iv.application?.company?.name || 'Company'} size="md" />
                        <div>
                          <div className="font-semibold text-[#0f172a]">
                            {iv.interview_type} Round
                          </div>
                          <div className="text-[11px] text-[#64748b] mt-0.5">
                            {iv.application?.job_title} · {iv.application?.company?.name}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#0f172a] tabular-nums bg-[#ffffff] px-2 py-1 rounded-[6px] border border-[#e2e8f0]">
                        {formatDateTimeMY(iv.scheduled_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1.5 border-t border-[#edf2f7]">
                      <span className="truncate">
                        {iv.interviewer ? `Interviewer: ${iv.interviewer}` : 'Interviewer TBD'}
                      </span>
                      {iv.application_id && (
                        <Link
                          to={`/applications/${iv.application_id}`}
                          className="text-[#0f766e] hover:underline shrink-0 font-medium"
                        >
                          View application
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications Sent This Week */}
          <div className="p-5 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0f172a]" />
                <h2 className="text-xs font-semibold text-[#0f172a]">
                  Applications sent this week ({summary?.this_week?.count || 0})
                </h2>
              </div>
              <span className="text-[11px] text-[#64748b]">Monday – Sunday</span>
            </div>

            {!summary?.this_week?.applications || summary.this_week.applications.length === 0 ? (
              <p className="text-xs text-[#64748b] italic py-4 text-center">
                No applications sent yet this week. Record one today!
              </p>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {summary.this_week.applications.map((app) => (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyAvatar name={app.company?.name || 'Company'} size="md" />
                      <div className="truncate">
                        <Link
                          to={`/applications/${app.id}`}
                          className="font-medium text-[#0f172a] hover:text-[#0f766e] truncate block"
                        >
                          {app.job_title}
                        </Link>
                        <div className="text-[11px] text-[#64748b] mt-0.5">
                          {app.company?.name} · Applied on{' '}
                          <span className="tabular-nums font-medium text-[#0f172a]">{formatDateMY(app.date_applied)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] bg-[#f1f5f9] text-[#334155] text-[11px] border border-[#e2e8f0] shrink-0 font-medium">
                      {app.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Application Modal */}
      <ApplicationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateApplication}
      />
    </div>
  );
};

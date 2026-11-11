import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Application, ApplicationStatus } from '../types';
import {
  getApplicationsApi,
  updateApplicationStatusApi,
} from '../api/applications';
import { formatDateMY } from '../utils/date';
import { STATUS_CONFIG } from '../components/ui/StatusBadge';
import { CompanyAvatar } from '../components/ui/CompanyAvatar';
import {
  ExternalLink,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface KanbanColumn {
  id: string;
  title: string;
  statuses: ApplicationStatus[];
  accent: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'saved', title: 'Saved', statuses: ['Saved'], accent: 'bg-[#64748b]' },
  { id: 'applied', title: 'Applied', statuses: ['Applied'], accent: 'bg-[#0369a1]' },
  { id: 'screening', title: 'Screening', statuses: ['Screening'], accent: 'bg-[#0f766e]' },
  { id: 'interview', title: 'Interview', statuses: ['Interview'], accent: 'bg-[#0d9488]' },
  { id: 'tech_test', title: 'Technical Test', statuses: ['Technical Test'], accent: 'bg-[#b45309]' },
  { id: 'offer', title: 'Offer', statuses: ['Offer'], accent: 'bg-[#15803d]' },
  { id: 'final', title: 'Final / Closed', statuses: ['Accepted', 'Rejected', 'Ghosted', 'Withdrawn'], accent: 'bg-[#475569]' },
];

export const KanbanPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [draggedAppId, setDraggedAppId] = useState<number | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getApplicationsApi({ per_page: 200, sort_by: 'date_applied', sort_order: 'desc' });
      setApplications(res.data);
    } catch (err) {
      console.error('Failed to load applications for kanban:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleDragStart = (appId: number) => {
    setDraggedAppId(appId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCol: KanbanColumn) => {
    e.preventDefault();
    setDragOverColId(null);

    if (!draggedAppId) return;

    const app = applications.find((a) => a.id === draggedAppId);
    if (!app) return;

    // Default status to assign in this column
    const newStatus: ApplicationStatus = targetCol.statuses[0];
    if (app.status === newStatus) return;

    // Optimistic UI update
    setApplications((prev) =>
      prev.map((a) => (a.id === draggedAppId ? { ...a, status: newStatus } : a))
    );

    try {
      const res = await updateApplicationStatusApi(draggedAppId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.id === draggedAppId ? res.application : a))
      );
    } catch (err) {
      console.error('Failed to change status on drop:', err);
      // Revert
      await fetchApplications();
    } finally {
      setDraggedAppId(null);
    }
  };

  const moveStatus = async (app: Application, direction: 'next' | 'prev') => {
    const pipeline: ApplicationStatus[] = [
      'Saved',
      'Applied',
      'Screening',
      'Interview',
      'Technical Test',
      'Offer',
      'Accepted',
    ];

    const currentIdx = pipeline.indexOf(app.status);
    if (currentIdx === -1) return;

    const nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0 || nextIdx >= pipeline.length) return;

    const newStatus = pipeline[nextIdx];

    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
    );

    try {
      const res = await updateApplicationStatusApi(app.id, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? res.application : a))
      );
    } catch (err) {
      console.error('Failed to move stage:', err);
      await fetchApplications();
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-[#64748b]">
        Loading Kanban pipeline...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
              Kanban Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-[6px] bg-[#f1f5f9] text-[#0f766e] text-xs font-semibold tabular-nums border border-[#e2e8f0]">
              {applications.length} applications
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Drag cards between columns to advance stages and record status audit history.
          </p>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="flex gap-3.5 overflow-x-auto pb-4 select-none">
        {KANBAN_COLUMNS.map((col) => {
          const colApps = applications.filter((a) => col.statuses.includes(a.status));
          const isOver = dragOverColId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col)}
              className={`w-72 shrink-0 rounded-[10px] bg-[#f8fafc] border flex flex-col max-h-[calc(100vh-210px)] transition-colors overflow-hidden ${
                isOver ? 'border-[#0f766e] bg-[#f0fdfa]' : 'border-[#e2e8f0]'
              }`}
            >
              {/* Column Top Accent Line */}
              <div className={`h-1 w-full ${col.accent}`} />

              {/* Column Header */}
              <div className="p-3 border-b border-[#e2e8f0] bg-[#ffffff] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0f172a]">
                  {col.title}
                </span>
                <span className="w-5 h-5 rounded-full bg-[#f1f5f9] text-[#64748b] text-[11px] font-semibold flex items-center justify-center tabular-nums border border-[#e2e8f0]">
                  {colApps.length}
                </span>
              </div>

              {/* Column Card List */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                {colApps.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-[#94a3b8] border border-dashed border-[#cbd5e1] rounded-[8px]">
                    No applications
                  </div>
                ) : (
                  colApps.map((app) => {
                    const statusCfg = STATUS_CONFIG[app.status] || {
                      bg: 'bg-[#f1f5f9]',
                      text: 'text-[#334155]',
                      border: 'border-[#cbd5e1]',
                    };

                    const isOverdue =
                      app.follow_up_date &&
                      new Date(app.follow_up_date) <= new Date() &&
                      !['Accepted', 'Rejected', 'Ghosted', 'Withdrawn'].includes(app.status);

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={() => handleDragStart(app.id)}
                        className="p-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:border-[#0f766e] transition-colors cursor-grab active:cursor-grabbing space-y-2 group"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <CompanyAvatar name={app.company?.name || 'Company'} size="sm" />
                            <span className="font-semibold text-xs text-[#0f172a] truncate">
                              {app.company?.name}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {app.status}
                          </span>
                        </div>

                        <div>
                          <Link
                            to={`/applications/${app.id}`}
                            className="text-xs font-medium text-[#0f172a] hover:text-[#0f766e] line-clamp-2 leading-snug transition-colors"
                          >
                            {app.job_title}
                          </Link>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1 border-t border-[#f1f5f9]">
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#f1f5f9] text-[#334155] font-medium">
                            {app.source}
                          </span>
                          <span className="tabular-nums flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#94a3b8]" />
                            {formatDateMY(app.date_applied)}
                          </span>
                        </div>

                        {/* Overdue indicator */}
                        {isOverdue && (
                          <div className="p-1 px-1.5 rounded-[4px] bg-[#fef3c7] border border-[#fde68a] text-[10px] text-[#92400e] flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Follow-up overdue</span>
                          </div>
                        )}

                        {/* Card Footer Quick Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5">
                            {app.screenshot_path && (
                              <span title="Screenshot attached">
                                <ImageIcon className="w-3 h-3 text-[#0f766e]" />
                              </span>
                            )}
                            <Link
                              to={`/applications/${app.id}`}
                              className="text-[10px] text-[#64748b] hover:text-[#0f766e] flex items-center gap-0.5"
                            >
                              <span>Details</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => moveStatus(app, 'prev')}
                              className="p-1 rounded-[4px] hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                              title="Move back"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStatus(app, 'next')}
                              className="p-1 rounded-[4px] hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                              title="Advance stage"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

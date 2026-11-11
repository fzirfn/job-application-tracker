import React, { useEffect } from 'react';
import type { Application } from '../../types';
import { formatDateTimeMY } from '../../utils/date';
import { StatusBadge } from '../ui/StatusBadge';
import { X, History, ArrowRight } from 'lucide-react';

interface StatusHistoryModalProps {
  application: Application | null;
  onClose: () => void;
}

export const StatusHistoryModal: React.FC<StatusHistoryModalProps> = ({
  application,
  onClose,
}) => {
  useEffect(() => {
    if (!application) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [application, onClose]);

  if (!application) return null;

  const history = application.status_history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 select-none">
      <div className="w-full max-w-lg bg-[#ffffff] border border-[#e2e8f0] rounded-[12px] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center border border-[#ccfbf1]">
              <History className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0f172a]">
                Stage history audit log
              </h2>
              <div className="text-xs text-[#64748b]">
                {application.job_title} · {application.company?.name}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-xs">
            <span className="text-[#64748b] font-medium">Current active stage:</span>
            <StatusBadge status={application.status} />
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#0f172a]">
              Stage transitions ({history.length})
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-[#64748b] italic py-3 text-center">
                No stage transitions recorded yet.
              </p>
            ) : (
              <div className="relative border-l-2 border-[#e2e8f0] ml-3 pl-4 space-y-4">
                {history.map((item, idx) => (
                  <div key={item.id || idx} className="relative group">
                    {/* Step marker */}
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0f766e] border-2 border-[#ffffff]" />

                    <div className="p-3.5 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] text-xs space-y-1.5">
                      <div className="flex items-center gap-2">
                        {item.from_status ? (
                          <>
                            <StatusBadge status={item.from_status} size="sm" />
                            <ArrowRight className="w-3 h-3 text-[#94a3b8]" />
                            <StatusBadge status={item.to_status} size="sm" />
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#64748b]">Initial stage:</span>
                            <StatusBadge status={item.to_status} size="sm" />
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-[#64748b] tabular-nums">
                        {formatDateTimeMY(item.changed_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#f1f5f9] bg-[#f8fafc] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

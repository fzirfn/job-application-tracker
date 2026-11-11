import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ScreenshotModalProps {
  url: string | null;
  title: string;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  url,
  title,
  onClose,
}) => {
  useEffect(() => {
    if (!url) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 select-none">
      <div className="w-full max-w-4xl bg-[#ffffff] border border-[#e2e8f0] rounded-[12px] flex flex-col max-h-[90vh]">
        <div className="px-6 py-3.5 border-b border-[#f1f5f9] flex items-center justify-between">
          <div className="text-xs font-semibold text-[#0f172a] truncate pr-4">
            Posting screenshot · {title}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] text-xs flex items-center gap-1 transition-colors"
              title="Open full size in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto flex items-center justify-center bg-[#f8fafc] rounded-b-[12px]">
          <img
            src={url}
            alt={`Screenshot of ${title}`}
            className="max-w-full max-h-[75vh] object-contain rounded-[8px] border border-[#e2e8f0]"
          />
        </div>
      </div>
    </div>
  );
};

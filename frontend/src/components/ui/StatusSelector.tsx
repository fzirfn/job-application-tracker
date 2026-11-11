import React, { useState } from 'react';
import type { ApplicationStatus } from '../../types';
import { ALL_STATUSES, STATUS_CONFIG } from './StatusBadge';
import { ChevronDown } from 'lucide-react';

interface StatusSelectorProps {
  currentStatus: ApplicationStatus;
  onStatusChange: (newStatus: ApplicationStatus) => Promise<void>;
  disabled?: boolean;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentConfig = STATUS_CONFIG[currentStatus] || {
    label: currentStatus,
    bg: 'bg-[#eeeeee]',
    text: 'text-[#3d3d3d]',
    border: 'border-[#d4d4d4]',
  };

  const handleSelect = async (status: ApplicationStatus) => {
    if (status === currentStatus || isUpdating) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setIsOpen(false);
    try {
      await onStatusChange(status);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled || isUpdating}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] border text-xs font-medium cursor-pointer transition-colors ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border} hover:opacity-90 disabled:opacity-50`}
      >
        <span>{isUpdating ? 'Saving...' : currentConfig.label}</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1 w-44 rounded-[6px] bg-[#ffffff] border border-[#e6e6e6] py-1 z-50 text-xs divide-y divide-[#f0f0f0]">
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] text-[#8a8a8a] font-medium">
                Active pipeline
              </div>
              {ALL_STATUSES.slice(0, 6).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleSelect(status)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#f6f6f6] flex items-center justify-between cursor-pointer ${
                    status === currentStatus ? 'font-semibold text-[#0a0a0a]' : 'text-[#3d3d3d]'
                  }`}
                >
                  <span>{status}</span>
                  {status === currentStatus && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
                  )}
                </button>
              ))}
            </div>

            <div className="py-1">
              <div className="px-3 py-1 text-[10px] text-[#8a8a8a] font-medium">
                Final states
              </div>
              {ALL_STATUSES.slice(6).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleSelect(status)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#f6f6f6] flex items-center justify-between cursor-pointer ${
                    status === currentStatus ? 'font-semibold text-[#0a0a0a]' : 'text-[#3d3d3d]'
                  }`}
                >
                  <span>{status}</span>
                  {status === currentStatus && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


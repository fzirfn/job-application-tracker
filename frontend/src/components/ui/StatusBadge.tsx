import React from 'react';
import type { ApplicationStatus } from '../../types';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  Saved: {
    label: 'Saved',
    bg: 'bg-[#f4f4f4]',
    text: 'text-[#4b5563]',
    border: 'border-[#e5e7eb]',
  },
  Applied: {
    label: 'Applied',
    bg: 'bg-[#eeeeee]',
    text: 'text-[#1f2937]',
    border: 'border-[#d1d5db]',
  },
  Screening: {
    label: 'Screening',
    bg: 'bg-[#fef3c7]',
    text: 'text-[#92400e]',
    border: 'border-[#fde68a]',
  },
  Interview: {
    label: 'Interview',
    bg: 'bg-[#dcfce7]',
    text: 'text-[#166534]',
    border: 'border-[#bbf7d0]',
  },
  'Technical Test': {
    label: 'Technical Test',
    bg: 'bg-[#e0f2fe]',
    text: 'text-[#075985]',
    border: 'border-[#bae6fd]',
  },
  Offer: {
    label: 'Offer',
    bg: 'bg-[#ecfdf5]',
    text: 'text-[#065f46]',
    border: 'border-[#a7f3d0]',
  },
  Accepted: {
    label: 'Accepted',
    bg: 'bg-[#dcfce7]',
    text: 'text-[#14532d]',
    border: 'border-[#86efac]',
  },
  Rejected: {
    label: 'Rejected',
    bg: 'bg-[#fee2e2]',
    text: 'text-[#991b1b]',
    border: 'border-[#fecaca]',
  },
  Ghosted: {
    label: 'Ghosted',
    bg: 'bg-[#f3f4f6]',
    text: 'text-[#6b7280]',
    border: 'border-[#e5e7eb]',
  },
  Withdrawn: {
    label: 'Withdrawn',
    bg: 'bg-[#f1f5f9]',
    text: 'text-[#475569]',
    border: 'border-[#cbd5e1]',
  },
};

export const ALL_STATUSES: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Screening',
  'Interview',
  'Technical Test',
  'Offer',
  'Accepted',
  'Rejected',
  'Ghosted',
  'Withdrawn',
];

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-[#eeeeee]',
    text: 'text-[#3d3d3d]',
    border: 'border-[#d4d4d4]',
  };

  const sizeClasses =
    size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-[4px] border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {config.label}
    </span>
  );
};


import React from 'react';

interface CompanyAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PALETTE = [
  { bg: 'bg-[#ecfdf5]', text: 'text-[#065f46]', border: 'border-[#a7f3d0]' }, // Emerald
  { bg: 'bg-[#eff6ff]', text: 'text-[#1e40af]', border: 'border-[#bfdbfe]' }, // Blue
  { bg: 'bg-[#fef2f2]', text: 'text-[#991b1b]', border: 'border-[#fecaca]' }, // Rose
  { bg: 'bg-[#fefce8]', text: 'text-[#854d0e]', border: 'border-[#fef08a]' }, // Amber
  { bg: 'bg-[#f5f3ff]', text: 'text-[#5b21b6]', border: 'border-[#ddd6fe]' }, // Purple
  { bg: 'bg-[#f0fdfa]', text: 'text-[#115e59]', border: 'border-[#99f6e4]' }, // Teal
  { bg: 'bg-[#fff7ed]', text: 'text-[#9a3412]', border: 'border-[#fed7aa]' }, // Orange
  { bg: 'bg-[#f8fafc]', text: 'text-[#334155]', border: 'border-[#cbd5e1]' }, // Slate
];

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
  name,
  size = 'md',
  className = '',
}) => {
  const theme = getPalette(name || 'Company');
  const initials = getInitials(name || 'Company');

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px] rounded-[5px]',
    md: 'w-8 h-8 text-xs rounded-[7px]',
    lg: 'w-11 h-11 text-sm rounded-[9px]',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center font-semibold border ${theme.bg} ${theme.text} ${theme.border} ${sizeClasses} shrink-0 select-none ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};


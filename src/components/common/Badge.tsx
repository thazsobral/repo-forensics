import React from 'react';
import { Severity } from '../../types/forensics';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Severity | 'default' | 'neutral' | 'accent' | 'success';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';

  const variantMap: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    neutral: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50',
    accent: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };

  const colorClass = variantMap[variant] || variantMap.default;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border ${sizeClasses} ${colorClass} ${className}`}
    >
      {children}
    </span>
  );
};

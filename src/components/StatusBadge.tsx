import React, { useState, useRef, useEffect } from 'react';
import { SubmissionStatus } from '@/types';

const statusStyles: Record<SubmissionStatus, string> = {
  New: 'bg-primary text-primary-foreground',
  Opened: 'bg-muted text-muted-foreground',
  Reviewed: 'bg-primary/10 text-primary',
  Passed: 'bg-destructive/10 text-destructive',
  Shortlisted: 'bmg-badge-accent',
};

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
  onStatusChange?: (status: SubmissionStatus) => void;
}

const STATUS_OPTIONS: SubmissionStatus[] = ['Reviewed', 'Passed', 'Shortlisted'];

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', onStatusChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!onStatusChange) {
    return (
      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${statusStyles[status]} ${className}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${statusStyles[status]} ${className}`}
      >
        {status} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[120px] animate-scale-in">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStatusChange(s);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors ${
                s === 'Passed' ? 'text-destructive' : s === 'Shortlisted' ? 'text-accent-foreground' : 'text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusBadge;

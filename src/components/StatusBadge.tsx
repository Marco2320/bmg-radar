import React from 'react';
import { SubmissionStatus } from '@/types';

const statusStyles: Record<SubmissionStatus, string> = {
  New: 'bg-muted text-muted-foreground',
  Reviewed: 'bg-primary/10 text-primary',
  Passed: 'bg-muted text-muted-foreground line-through opacity-60',
  Shortlisted: 'bmg-badge-accent',
};

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => (
  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${statusStyles[status]} ${className}`}>
    {status}
  </span>
);

export default StatusBadge;

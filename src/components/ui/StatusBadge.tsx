import { EvidenceStatus } from '@/types';
import { evidenceStatusLabel, evidenceStatusColor } from '@/lib/utils';
import { CheckCircle, AlertCircle, HelpCircle, XCircle, Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: EvidenceStatus;
  size?: 'sm' | 'md';
}

const statusIcon = {
  verified: CheckCircle,
  strong: CheckCircle,
  partial: AlertCircle,
  needs_validation: HelpCircle,
  not_found: XCircle,
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { color, bg, border } = evidenceStatusColor[status];
  const Icon = statusIcon[status] ?? Circle;
  const label = evidenceStatusLabel[status];

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'md' ? '4px 8px' : '2px 7px',
        borderRadius: 5,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: size === 'md' ? '0.75rem' : '0.6875rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      <Icon size={size === 'md' ? 12 : 11} />
      <span>{label}</span>
    </span>
  );
}

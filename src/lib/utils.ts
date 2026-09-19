import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EvidenceStatus, CandidateGroup, CandidateStage, JobStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ─── Status helpers ──────────────────────────────────────────────────────────

export const evidenceStatusLabel: Record<EvidenceStatus, string> = {
  verified: 'Verified',
  strong: 'Strong Evidence',
  partial: 'Partial Evidence',
  needs_validation: 'Needs Validation',
  not_found: 'Not Found',
};

export const evidenceStatusColor: Record<EvidenceStatus, { color: string; bg: string; border: string }> = {
  verified: { color: 'var(--status-verified)', bg: 'var(--status-verified-bg)', border: 'var(--status-verified-border)' },
  strong: { color: 'var(--status-strong)', bg: 'var(--status-strong-bg)', border: 'var(--status-verified-border)' },
  partial: { color: 'var(--status-partial)', bg: 'var(--status-partial-bg)', border: 'var(--status-partial-border)' },
  needs_validation: { color: 'var(--status-validation)', bg: 'var(--status-validation-bg)', border: 'var(--status-validation-border)' },
  not_found: { color: 'var(--status-notfound)', bg: 'var(--status-notfound-bg)', border: 'var(--status-notfound-border)' },
};

export const groupLabel: Record<CandidateGroup, string> = {
  strong_match: 'Strong Match',
  potential_match: 'Potential Match',
  needs_validation: 'Needs Validation',
  insufficient_evidence: 'Insufficient Evidence',
};

export const groupColor: Record<CandidateGroup, { color: string; bg: string }> = {
  strong_match: { color: 'var(--status-verified)', bg: 'var(--status-verified-bg)' },
  potential_match: { color: '#1d4ed8', bg: '#eff6ff' },
  needs_validation: { color: 'var(--status-validation)', bg: 'var(--status-validation-bg)' },
  insufficient_evidence: { color: 'var(--status-notfound)', bg: 'var(--status-notfound-bg)' },
};

export const stageLabel: Record<CandidateStage, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  evaluation: 'Evaluation',
  decision: 'Decision',
};

export const stageColor: Record<CandidateStage, string> = {
  applied: '#6b7280',
  screening: '#1d4ed8',
  interview: 'var(--accent)',
  evaluation: 'var(--status-partial)',
  decision: 'var(--status-verified)',
};

export const jobStatusColor: Record<JobStatus, { color: string; bg: string }> = {
  active: { color: 'var(--status-verified)', bg: 'var(--status-verified-bg)' },
  draft: { color: 'var(--status-notfound)', bg: 'var(--status-notfound-bg)' },
  closed: { color: '#6b7280', bg: '#f3f4f6' },
  paused: { color: 'var(--status-partial)', bg: 'var(--status-partial-bg)' },
};

export function coverageLevel(coverage: number): { color: string; label: string } {
  if (coverage >= 85) return { color: 'var(--status-verified)', label: 'High' };
  if (coverage >= 65) return { color: '#1d4ed8', label: 'Good' };
  if (coverage >= 40) return { color: 'var(--status-validation)', label: 'Partial' };
  return { color: 'var(--status-notfound)', label: 'Low' };
}

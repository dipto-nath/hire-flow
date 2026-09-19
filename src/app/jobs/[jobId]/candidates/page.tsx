'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Avatar, CoverageBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockJobs } from '@/mock-data/jobs';
import { mockCandidates } from '@/mock-data/candidates';
import { formatRelativeTime, groupLabel, groupColor, stageLabel, stageColor, evidenceStatusColor } from '@/lib/utils';
import { Search, Filter, ChevronRight, ChevronDown, Users } from 'lucide-react';
import Link from 'next/link';
import { Candidate, CandidateGroup, CandidateStage } from '@/types';

const groupTabs = [
  { key: 'all', label: 'All' },
  { key: 'strong_match', label: 'Strong Match' },
  { key: 'potential_match', label: 'Potential Match' },
  { key: 'needs_validation', label: 'Needs Validation' },
  { key: 'insufficient_evidence', label: 'Insufficient Evidence' },
];

export default function JobCandidatesPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const job = mockJobs.find(j => j.id === jobId);
  const allCandidates = mockCandidates.filter(c => c.jobId === jobId);

  const filtered = allCandidates.filter(c => {
    if (activeGroup !== 'all' && c.group !== activeGroup) return false;
    if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.currentRole.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q));
    }
    return true;
  });

  if (!job) return null;

  return (
    <AppShell
      title="Candidates"
      breadcrumbs={[{ label: 'Jobs', href: '/jobs' }, { label: job.title, href: `/jobs/${jobId}` }, { label: 'Candidates' }]}
    >
      <div>
        {/* Header */}
        <div style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={16} color="var(--text-muted)" />
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              {filtered.length} Candidates
            </span>
            {activeGroup !== 'all' && (
              <Badge color={groupColor[activeGroup as CandidateGroup]?.color} bg={groupColor[activeGroup as CandidateGroup]?.bg}>
                {groupLabel[activeGroup as CandidateGroup]}
              </Badge>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search candidates"
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                  border: '1px solid var(--border-default)', borderRadius: 7,
                  fontSize: '0.8125rem', color: 'var(--text-primary)', background: 'var(--bg-base)',
                  width: 220, outline: 'none',
                }}
              />
            </div>
            {/* Stage filter */}
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              aria-label="Filter by stage"
              style={{
                padding: '7px 28px 7px 10px', border: '1px solid var(--border-default)',
                borderRadius: 7, fontSize: '0.8125rem', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">All stages</option>
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="evaluation">Evaluation</option>
              <option value="decision">Decision</option>
            </select>
          </div>
        </div>

        {/* Group tabs */}
        <div style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          padding: '0 24px',
          gap: 0,
          overflowX: 'auto',
        }}>
          {groupTabs.map(t => {
            const count = t.key === 'all' ? allCandidates.length : allCandidates.filter(c => c.group === t.key).length;
            const isActive = activeGroup === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveGroup(t.key)}
                role="tab"
                aria-selected={isActive}
                style={{
                  padding: '11px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                {t.label}
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 600,
                  padding: '1px 6px', borderRadius: 10,
                  background: isActive ? 'var(--accent-light)' : 'var(--bg-muted)',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p style={{ margin: '12px 24px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Groups are based on available evidence and role requirements. Recruiters can override grouping on the candidate profile.
        </p>

        {/* Candidate Table */}
        <div style={{ padding: '12px 24px 48px' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-base)' }}>
                  {['Candidate', 'Current Role', 'Exp', 'Skills', 'Coverage', 'Validation', 'Stage', 'Updated', ''].map(h => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: 'left', fontSize: '0.6875rem',
                      fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em',
                      textTransform: 'uppercase', borderBottom: '1px solid var(--border-default)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No candidates match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <CandidateRow key={c.id} candidate={c} isLast={i === filtered.length - 1} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function CandidateRow({ candidate: c, isLast }: { candidate: Candidate; isLast: boolean }) {
  return (
    <tr
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-muted)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Candidate */}
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={c.initials} color={c.avatarColor} size={30} name={c.name} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{c.location}</div>
          </div>
        </div>
      </td>
      {/* Current role */}
      <td style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{c.currentRole}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.currentCompany}</div>
      </td>
      {/* Experience */}
      <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        {c.yearsExperience}y
      </td>
      {/* Skills */}
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
          {c.skills.slice(0, 3).map(skill => (
            <Badge key={skill}>{skill}</Badge>
          ))}
          {c.skills.length > 3 && <Badge>+{c.skills.length - 3}</Badge>}
        </div>
      </td>
      {/* Coverage */}
      <td style={{ padding: '12px 14px', minWidth: 120 }}>
        <CoverageBar value={c.requirementCoverage} size="sm" />
      </td>
      {/* Validation */}
      <td style={{ padding: '12px 14px' }}>
        {c.validationNeeded ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--status-validation)', fontWeight: 500 }}>⚠ Needed</span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--status-verified)', fontWeight: 500 }}>✓ Clear</span>
        )}
      </td>
      {/* Stage */}
      <td style={{ padding: '12px 14px' }}>
        <Badge
          color={stageColor[c.stage]}
          bg={`${stageColor[c.stage]}18`}
        >
          {stageLabel[c.stage]}
        </Badge>
      </td>
      {/* Updated */}
      <td style={{ padding: '12px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {formatRelativeTime(c.updatedAt)}
      </td>
      {/* Action */}
      <td style={{ padding: '12px 14px' }}>
        <Link href={`/candidates/${c.id}`}>
          <Button variant="ghost" size="sm">
            View <ChevronRight size={13} />
          </Button>
        </Link>
      </td>
    </tr>
  );
}

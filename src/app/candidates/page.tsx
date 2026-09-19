'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Avatar, CoverageBar, PageHeader } from '@/components/ui';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { formatRelativeTime, groupLabel, groupColor, stageLabel, stageColor } from '@/lib/utils';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Candidate } from '@/types';

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.candidates.list({ limit: 100 });
        setCandidates(res.candidates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const filtered = candidates.filter(c => {
    if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
    if (groupFilter !== 'all' && c.group !== groupFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const currentRole = c.currentRole || '';
      const currentCompany = c.currentCompany || '';
      return c.name.toLowerCase().includes(q) || currentRole.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q)) || currentCompany.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AppShell title="Candidates" breadcrumbs={[{ label: 'Candidates' }]}>
      <div>
        <PageHeader
          title="Candidates"
          subtitle={loading ? 'Loading...' : `${candidates.length} candidates across all active roles`}
        />

        {/* Filters */}
        <div style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          padding: '12px 24px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
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
                fontSize: '0.8125rem', background: 'var(--bg-base)',
                width: 240, outline: 'none', color: 'var(--text-primary)',
              }}
            />
          </div>
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            aria-label="Filter by stage"
            style={{ padding: '7px 28px 7px 10px', border: '1px solid var(--border-default)', borderRadius: 7, fontSize: '0.8125rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All stages</option>
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="interview">Interview</option>
            <option value="evaluation">Evaluation</option>
          </select>
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            aria-label="Filter by match group"
            style={{ padding: '7px 28px 7px 10px', border: '1px solid var(--border-default)', borderRadius: 7, fontSize: '0.8125rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All groups</option>
            <option value="strong_match">Strong Match</option>
            <option value="potential_match">Potential Match</option>
            <option value="needs_validation">Needs Validation</option>
            <option value="insufficient_evidence">Insufficient Evidence</option>
          </select>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} results
          </span>
        </div>

        {/* Table */}
        <div style={{ padding: '16px 24px 48px' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-base)' }}>
                  {['Candidate', 'Current Role', 'Exp', 'Skills', 'Coverage', 'Group', 'Stage', 'Updated', ''].map(h => (
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
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Loading candidates...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No candidates found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-muted)' : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar initials={c.firstName?.[0] + (c.lastName?.[0] || '') || 'C'} color={'var(--accent)'} size={30} name={c.name} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.name}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{c.currentRole}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.currentCompany}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.yearsExperience || 0}y</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                          {c.skills?.slice(0, 2).map(s => <Badge key={s}>{s}</Badge>)}
                          {c.skills?.length > 2 && <Badge>+{c.skills.length - 2}</Badge>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', minWidth: 110 }}>
                        <CoverageBar value={c.requirementCoverage || 0} size="sm" />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Badge color={groupColor[c.group]?.color || 'gray'} bg={groupColor[c.group]?.bg || '#f3f4f6'}>
                          {groupLabel[c.group] || c.group}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Badge color={stageColor[c.stage] || 'gray'} bg={`${stageColor[c.stage] || 'gray'}18`}>
                          {stageLabel[c.stage] || c.stage}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatRelativeTime(c.updatedAt)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Link href={`/candidates/${c.id}`}>
                          <Button variant="ghost" size="sm">View <ChevronRight size={13} /></Button>
                        </Link>
                      </td>
                    </tr>
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

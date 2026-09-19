'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, Button, Badge, Tabs } from '@/components/ui';
import { mockJobs } from '@/mock-data/jobs';
import { formatDate, jobStatusColor } from '@/lib/utils';
import { Plus, ArrowRight, Users, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { Job } from '@/types';

const tabOptions = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'closed', label: 'Closed' },
];

export default function JobsPage() {
  const [tab, setTab] = useState('all');

  const filtered = tab === 'all' ? mockJobs : mockJobs.filter(j => j.status === tab);

  return (
    <AppShell title="Jobs" breadcrumbs={[{ label: 'Jobs' }]}>
      <div>
        <PageHeader
          title="Jobs"
          subtitle={`${mockJobs.filter(j => j.status === 'active').length} active roles`}
          actions={
            <Link href="/jobs/create">
              <Button variant="primary" size="md">
                <Plus size={15} /> Create Job
              </Button>
            </Link>
          }
        />

        <Tabs tabs={tabOptions.map(t => ({ ...t, count: t.key === 'all' ? mockJobs.length : mockJobs.filter(j => j.status === t.key).length }))} active={tab} onChange={setTab} />

        <div style={{ padding: '20px 24px' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-base)' }}>
                  {['Role', 'Department', 'Candidates', 'Interviews', 'Status', 'Created', 'Last Activity', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid var(--border-default)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No jobs in this category yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((job: Job, i) => {
                    const { color, bg } = jobStatusColor[job.status];
                    return (
                      <tr
                        key={job.id}
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-muted)' : 'none' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{job.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {job.location} · {job.employmentType.replace('_', '-')}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{job.department}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Users size={13} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{job.candidateCount}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CalendarCheck size={13} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.8125rem' }}>{job.interviewCount}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Badge color={color} bg={bg}>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</Badge>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {formatDate(job.createdAt)}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {formatDate(job.updatedAt)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm">
                              Open <ArrowRight size={13} />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

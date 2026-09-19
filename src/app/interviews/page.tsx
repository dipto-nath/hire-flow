'use client';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, Button, Badge, Avatar, SectionHeader } from '@/components/ui';
import { mockInterviews } from '@/mock-data/interviews';
import { mockCandidates } from '@/mock-data/candidates';
import { mockJobs } from '@/mock-data/jobs';
import { formatDateTime, formatDate } from '@/lib/utils';
import { CalendarCheck, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function InterviewsPage() {
  const enriched = mockInterviews.map(interview => {
    const candidate = mockCandidates.find(c => c.id === interview.candidateId);
    const job = mockJobs.find(j => j.id === interview.jobId);
    return { interview, candidate, job };
  });

  const statusColor = (status: string): { color: string; bg: string } => {
    if (status === 'completed') return { color: 'var(--status-verified)', bg: 'var(--status-verified-bg)' };
    if (status === 'scheduled') return { color: 'var(--accent)', bg: 'var(--accent-light)' };
    if (status === 'in_progress') return { color: '#92400e', bg: '#fffbeb' };
    return { color: 'var(--text-muted)', bg: 'var(--bg-muted)' };
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle size={14} />;
    if (status === 'scheduled') return <Clock size={14} />;
    return <CalendarCheck size={14} />;
  };

  return (
    <AppShell title="Interviews" breadcrumbs={[{ label: 'Interviews' }]}>
      <div>
        <PageHeader
          title="Interviews"
          subtitle={`${mockInterviews.length} interviews tracked`}
        />

        <div style={{ padding: '20px 24px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Scheduled', count: mockInterviews.filter(i => i.status === 'scheduled').length, color: 'var(--accent)' },
              { label: 'Completed', count: mockInterviews.filter(i => i.status === 'completed').length, color: 'var(--status-verified)' },
              { label: 'Total', count: mockInterviews.length, color: 'var(--text-secondary)' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: '16px 20px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color, marginTop: 4 }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {enriched.map(({ interview, candidate, job }) => {
              if (!candidate || !job) return null;
              const { color, bg } = statusColor(interview.status);
              return (
                <div key={interview.id} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <Avatar initials={candidate.initials} color={candidate.avatarColor} size={40} name={candidate.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {candidate.name}
                      </span>
                      <Badge color={color} bg={bg}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {statusIcon(interview.status)} {interview.status.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {job.title} · {interview.interviewers.join(', ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {interview.scheduledAt && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                        {interview.status === 'completed' ? 'Completed:' : 'Scheduled:'} {formatDate(interview.scheduledAt)}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {interview.notes.length} notes · {interview.questions.length} questions
                    </div>
                  </div>
                  <Link href={`/candidates/${candidate.id}/interview`}>
                    <Button variant="ghost" size="sm">Open <ArrowRight size={13} /></Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

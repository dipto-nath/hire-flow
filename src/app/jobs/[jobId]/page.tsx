// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Tabs, Avatar, CoverageBar, SectionHeader, UploadModal } from '@/components/ui';
import { api } from '@/lib/api';
import { Job, Candidate, AuditEvent } from '@/types';
import { formatRelativeTime, formatDate, jobStatusColor, groupLabel, groupColor, stageLabel, stageColor, evidenceStatusColor } from '@/lib/utils';
import {
  Upload, Edit, ChevronRight, Users, ArrowRight, CheckCircle,
  AlertCircle, XCircle, HelpCircle, FileText, BarChart3
} from 'lucide-react';
import Link from 'next/link';

const workspaceTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'candidates', label: 'Candidates' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'reports', label: 'Reports' },
  { key: 'audit', label: 'Audit' },
];

export default function JobWorkspacePage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [tab, setTab] = useState('overview');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobAudit, setJobAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobData = async () => {
    try {
      const [jobData, auditRes] = await Promise.all([
        api.jobs.get(jobId),
        api.audit.list({ jobId, limit: 5 }),
      ]);
      setJob(jobData);
      setCandidates(jobData.candidates || []);
      setJobAudit(auditRes.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchJobData();
  }, [jobId]);

  if (loading) {
    return (
      <AppShell title="Loading Job...">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading job details...</p>
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell title="Job not found">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>This job could not be found.</p>
          <Link href="/jobs" style={{ color: 'var(--accent)' }}>Back to Jobs</Link>
        </div>
      </AppShell>
    );
  }

  const { color, bg } = jobStatusColor[job.status];

  const stageBreakdown = [
    { label: 'Applied', key: 'applied', count: candidates.filter(c => c.stage === 'applied').length },
    { label: 'Screening', key: 'screening', count: candidates.filter(c => c.stage === 'screening').length },
    { label: 'Interview', key: 'interview', count: candidates.filter(c => c.stage === 'interview').length },
    { label: 'Evaluation', key: 'evaluation', count: candidates.filter(c => c.stage === 'evaluation').length },
    { label: 'Decision', key: 'decision', count: candidates.filter(c => c.stage === 'decision').length },
  ];

  const groupBreakdown = [
    { key: 'strong_match', count: candidates.filter(c => c.group === 'strong_match').length },
    { key: 'potential_match', count: candidates.filter(c => c.group === 'potential_match').length },
    { key: 'needs_validation', count: candidates.filter(c => c.group === 'needs_validation').length },
    { key: 'insufficient_evidence', count: candidates.filter(c => c.group === 'insufficient_evidence').length },
  ] as const;

  return (
    <AppShell
      title={job.title}
      breadcrumbs={[{ label: 'Jobs', href: '/jobs' }, { label: job.title }]}
    >
      {/* Job Header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        padding: '20px 28px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {job.title}
              </h1>
              <Badge color={color} bg={bg}>{job.status}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span>{job.department}</span>
              <span>·</span>
              <span>{job.location}</span>
              <span>·</span>
              <span>{job.employmentType.replace('_', ' ')}</span>
              <span>·</span>
              <span>{job.experienceLevel} level</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(true)}>
              <Upload size={14} /> Upload Candidates
            </Button>
            <Button variant="secondary" size="sm">
              <Edit size={14} /> Edit Role
            </Button>
            <Link href={`/jobs/${jobId}/candidates`}>
              <Button variant="primary" size="sm">
                <Users size={14} /> View Candidates
              </Button>
            </Link>
          </div>
        </div>
        <Tabs tabs={workspaceTabs.map(t => ({ ...t, count: t.key === 'candidates' ? candidates.length : undefined }))} active={tab} onChange={setTab} />
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px 28px 48px' }}>
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
            {/* Main */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Pipeline */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: 20,
              }}>
                <SectionHeader title="Hiring Progress" description={`${candidates.length} total candidates`} />
                <div style={{ display: 'flex', gap: 0, overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-default)' }}>
                  {stageBreakdown.map((stage, i) => {
                    const pct = candidates.length > 0 ? Math.round((stage.count / candidates.length) * 100) : 0;
                    const colors: Record<string, string> = {
                      applied: '#6b7280', screening: '#1d4ed8',
                      interview: 'var(--accent)', evaluation: '#92400e', decision: 'var(--status-verified)',
                    };
                    return (
                      <div
                        key={stage.key}
                        style={{
                          flex: 1,
                          padding: '14px 12px',
                          borderRight: i < stageBreakdown.length - 1 ? '1px solid var(--border-default)' : 'none',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.375rem', fontWeight: 700, color: colors[stage.key] }}>
                          {stage.count}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
                          {stage.label}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-faint)', marginTop: 1 }}>
                          {pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Requirement Coverage Matrix */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-muted)' }}>
                  <SectionHeader title="Requirement Coverage" description="How candidates map to role requirements" />
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-base)' }}>
                      {['Requirement', 'Type', 'Candidates', 'Evidence'].map(h => (
                        <th key={h} style={{
                          padding: '8px 16px', textAlign: 'left', fontSize: '0.6875rem',
                          fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em',
                          textTransform: 'uppercase', borderBottom: '1px solid var(--border-muted)',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {job.requirements.map((req, i) => {
                      const coveredCount = candidates.filter(c =>
                        c.evidence.some(e => e.requirementId === req.id && (e.status === 'verified' || e.status === 'strong'))
                      ).length;
                      const pct = candidates.length > 0 ? Math.round((coveredCount / candidates.length) * 100) : 0;
                      const strength = pct >= 75 ? 'Strong' : pct >= 50 ? 'Mixed' : 'Partial';
                      const strengthColor = pct >= 75 ? 'var(--status-verified)' : pct >= 50 ? '#1d4ed8' : 'var(--status-validation)';

                      return (
                        <tr key={req.id} style={{ borderBottom: i < job.requirements.length - 1 ? '1px solid var(--border-muted)' : 'none' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{req.label}</div>
                            {req.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{req.description}</div>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <Badge
                              color={req.type === 'required' ? 'var(--accent)' : 'var(--text-muted)'}
                              bg={req.type === 'required' ? 'var(--accent-light)' : 'var(--bg-muted)'}
                            >
                              {req.type}
                            </Badge>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {coveredCount}/{candidates.length}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: strengthColor }}>{strength}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Candidate Distribution */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: 20,
              }}>
                <SectionHeader title="Candidate Distribution" />
                <p style={{ margin: '0 0 14px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Groups are based on available evidence and role requirements.
                </p>
                {groupBreakdown.map(({ key, count }) => {
                  const { color: gc, bg: gbg } = groupColor[key];
                  return (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {groupLabel[key]}
                        </span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: gc }}>
                          {count}
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'var(--border-muted)', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: candidates.length > 0 ? `${(count / candidates.length) * 100}%` : '0',
                          background: gc,
                          borderRadius: 5,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
                <Link href={`/jobs/${jobId}/candidates`} style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                    View All Candidates <ChevronRight size={13} />
                  </Button>
                </Link>
              </div>

              {/* Job Description excerpt */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: 20,
              }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  About this role
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {job.description.slice(0, 220)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'candidates' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{candidates.length} candidates</span>
              <Link href={`/jobs/${jobId}/candidates`}>
                <Button variant="primary" size="sm">View Full Candidate Table <ArrowRight size={13} /></Button>
              </Link>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, overflow: 'hidden' }}>
              {candidates.slice(0, 6).map((c, i) => (
                <Link
                  key={c.id}
                  href={`/candidates/${c.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 18px',
                    borderBottom: i < 5 ? '1px solid var(--border-muted)' : 'none',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Avatar initials={c.firstName?.[0] + (c.lastName?.[0] || '') || 'C'} color="var(--accent)" size={32} name={c.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.currentRole || 'No role'} · {c.currentCompany || 'No company'}</div>
                  </div>
                  <CoverageBar value={c.requirementCoverage} size="sm" />
                  <Badge
                    color={groupColor[c.group]?.color || 'gray'}
                    bg={groupColor[c.group]?.bg || '#f3f4f6'}
                  >
                    {groupLabel[c.group] || c.group}
                  </Badge>
                  <ChevronRight size={14} color="var(--text-faint)" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {tab === 'requirements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {job.requirements.map(req => (
              <div key={req.id} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{req.label}</span>
                    <Badge
                      color={req.type === 'required' ? 'var(--accent)' : 'var(--text-muted)'}
                      bg={req.type === 'required' ? 'var(--accent-light)' : 'var(--bg-muted)'}
                    >
                      {req.type}
                    </Badge>
                  </div>
                  <Badge>{req.category}</Badge>
                </div>
                {req.description && <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{req.description}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobAudit.map(event => (
              <div key={event.id} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: 18,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {event.candidateName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {event.insight}
                </p>
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Source: {event.sourceLabel} · {event.action}
                </div>
              </div>
            ))}
            <Link href="/audit" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">View full audit trail <ArrowRight size={13} /></Button>
            </Link>
          </div>
        )}

        {(tab === 'interviews' || tab === 'reports') && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.875rem' }}>Navigate to the relevant section for detailed views.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <Link href="/interviews"><Button variant="secondary" size="sm">All Interviews</Button></Link>
              <Link href="/reports"><Button variant="secondary" size="sm">All Reports</Button></Link>
            </div>
          </div>
        )}
      </div>

      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        jobId={jobId}
        onUploadComplete={fetchJobData}
      />
    </AppShell>
  );
}

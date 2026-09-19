'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MetricBlock, SectionHeader, Button, Badge, Avatar, CoverageBar } from '@/components/ui';
import { formatRelativeTime, jobStatusColor, stageLabel } from '@/lib/utils';
import { api } from '@/lib/api';
import { Job, Candidate, AuditEvent } from '@/types';
import {
  Briefcase, Users, CalendarCheck, AlertTriangle,
  ArrowRight, ChevronRight, Upload, Clock, FileText,
  CheckCircle, Circle,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const pipelineData = [
  { week: 'Aug 26', applied: 8, screening: 5, interview: 2, evaluation: 1 },
  { week: 'Sep 2', applied: 12, screening: 7, interview: 4, evaluation: 2 },
  { week: 'Sep 9', applied: 7, screening: 9, interview: 5, evaluation: 3 },
  { week: 'Sep 16', applied: 5, screening: 6, interview: 6, evaluation: 4 },
  { week: 'Sep 19', applied: 4, screening: 4, interview: 4, evaluation: 3 },
];

const attentionItems = [
  { id: 1, text: '3 candidates have missing experience validation', type: 'warning', href: '/jobs/job-fe-001/candidates', count: 3 },
  { id: 2, text: '2 interview evaluations are incomplete', type: 'warning', href: '/candidates', count: 2 },
  { id: 3, text: '4 candidates have unanswered role requirements', type: 'info', href: '/jobs/job-fe-001/candidates', count: 4 },
  { id: 4, text: '1 interview note has conflicting evidence', type: 'error', href: '/audit', count: 1 },
];

const recentActivity = [
  { id: 1, label: 'Priya Nair interview completed', time: '2026-09-17T15:00:00Z', type: 'interview', icon: CheckCircle, color: 'var(--status-verified)' },
  { id: 2, label: 'Aarav Mehta evaluation report generated', time: '2026-09-15T14:30:00Z', type: 'report', icon: FileText, color: 'var(--accent)' },
  { id: 3, label: 'Marcos Oliveira interview completed', time: '2026-09-16T15:30:00Z', type: 'interview', icon: CheckCircle, color: 'var(--status-verified)' },
  { id: 4, label: '8 resumes processed — Senior Frontend Engineer', time: '2026-09-14T09:00:00Z', type: 'upload', icon: Upload, color: '#0369a1' },
  { id: 5, label: 'Lena Bauer interview scheduled for Sep 20', time: '2026-09-14T09:00:00Z', type: 'schedule', icon: Clock, color: 'var(--status-partial)' },
];

export default function DashboardPage() {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [inInterview, setInInterview] = useState(0);
  const [awaitingEval, setAwaitingEval] = useState(0);
  const [attentionCount, setAttentionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, candidatesRes, attentionRes] = await Promise.all([
          api.jobs.list({ status: 'active', limit: 5 }),
          api.candidates.list({ limit: 1 }), // Just for total count
          api.candidates.list({ stage: 'interview' }), // In interview
        ]);
        
        setActiveJobs(jobsRes.jobs);
        setTotalCandidates(candidatesRes.total);
        setInInterview(attentionRes.total);
        // Note: we can expand this to fetch more accurate pipeline numbers
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AppShell title="Dashboard">
      <div style={{ padding: '28px 28px 48px' }}>
        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Good morning, Alex
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Here&apos;s what&apos;s happening across your hiring pipeline.
          </p>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          <MetricBlock
            label="Active Roles"
            value={activeJobs.length}
            delta="+1 this month"
            deltaPositive
            icon={<Briefcase size={15} />}
          />
          <MetricBlock
            label="Candidates in Review"
            value={totalCandidates}
            delta={loading ? 'Loading...' : `${attentionCount} need attention`}
            icon={<Users size={15} />}
          />
          <MetricBlock
            label="Interviews This Week"
            value={inInterview}
            delta="1 scheduled, 2 completed"
            icon={<CalendarCheck size={15} />}
          />
          <MetricBlock
            label="Awaiting Evaluation"
            value={awaitingEval}
            delta="Reports pending"
            icon={<FileText size={15} />}
          />
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Hiring Activity chart */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: 20,
            }}>
              <SectionHeader title="Hiring Activity" description="Candidate movement across pipeline stages" />
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pipelineData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3730a3" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3730a3" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInterview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0369a1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0369a1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8 }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="applied" stroke="#3730a3" strokeWidth={2} fill="url(#colorApplied)" name="Applied" />
                    <Area type="monotone" dataKey="screening" stroke="#0369a1" strokeWidth={2} fill="url(#colorInterview)" name="Screening" />
                    <Area type="monotone" dataKey="interview" stroke="#065f46" strokeWidth={2} fill="none" name="Interview" />
                    <Area type="monotone" dataKey="evaluation" stroke="#92400e" strokeWidth={2} fill="none" name="Evaluation" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[
                  { label: 'Applied', color: '#3730a3' },
                  { label: 'Screening', color: '#0369a1' },
                  { label: 'Interview', color: '#065f46' },
                  { label: 'Evaluation', color: '#92400e' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Roles */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-muted)' }}>
                <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Active Roles</h2>
                <Link href="/jobs" style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  View all <ChevronRight size={13} />
                </Link>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-base)' }}>
                    {['Role', 'Dept', 'Candidates', 'Interviews', 'Stage', 'Updated', ''].map(h => (
                      <th key={h} style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid var(--border-muted)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeJobs.map((job, i) => {
                    const { color, bg } = jobStatusColor[job.status] || jobStatusColor['draft'];
                    return (
                      <tr
                        key={job.id}
                        style={{ borderBottom: i < activeJobs.length - 1 ? '1px solid var(--border-muted)' : 'none' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{job.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{job.location}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{job.department}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{job.candidateCount || 0}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{job.interviewCount || 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge color={color} bg={bg}>{job.hiringStage}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatRelativeTime(job.updatedAt)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm">
                              Open <ArrowRight size={13} />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {activeJobs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        No active roles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Needs Attention */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color="var(--status-validation)" />
                <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Needs Attention</h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {attentionItems.map((item, i) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 18px',
                      textDecoration: 'none',
                      borderBottom: i < attentionItems.length - 1 ? '1px solid var(--border-muted)' : 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: item.type === 'error' ? 'var(--status-warning-bg)' : 'var(--status-validation-bg)',
                      color: item.type === 'error' ? 'var(--status-warning)' : 'var(--status-validation)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                    }}>
                      {item.count}
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>
                      {item.text}
                    </span>
                    <ChevronRight size={14} color="var(--text-faint)" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-muted)' }}>
                <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {recentActivity.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} style={{
                      display: 'flex',
                      gap: 12,
                      padding: '10px 18px',
                      borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-muted)' : 'none',
                      position: 'relative',
                    }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: `${item.color}18`,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={13} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: 2 }}>
                          {formatRelativeTime(item.time)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

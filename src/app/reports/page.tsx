'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, SectionHeader, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { stageLabel, stageColor } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const stageKeys = ['applied', 'screening', 'interview', 'evaluation', 'decision'] as const;

export default function ReportsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, candidatesData] = await Promise.all([
          api.jobs.list(),
          api.candidates.list(),
        ]);
        setJobs(jobsData.jobs || []);
        setCandidates(candidatesData.candidates || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeJobs = jobs.filter(j => j.status === 'active');

  const pipelineData = stageKeys.map(stage => ({
    name: stageLabel[stage],
    count: candidates.filter(c => c.stage === stage).length,
    color: stageColor[stage],
  }));

  const groupData = [
    { name: 'Strong Match', value: candidates.filter(c => c.group === 'strong_match').length, color: '#15803d' },
    { name: 'Potential Match', value: candidates.filter(c => c.group === 'potential_match').length, color: '#1d4ed8' },
    { name: 'Needs Validation', value: candidates.filter(c => c.group === 'needs_validation').length, color: '#92400e' },
    { name: 'Insufficient Evidence', value: candidates.filter(c => c.group === 'insufficient_evidence').length, color: '#6b7280' },
  ];

  return (
    <AppShell title="Reports" breadcrumbs={[{ label: 'Reports' }]}>
      <div>
        <PageHeader
          title="Reports"
          subtitle="Hiring pipeline analytics and candidate distribution"
        />

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading report data...
          </div>
        ) : (
          <div style={{ padding: '24px 24px 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Pipeline chart */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: 20,
            }}>
              <SectionHeader title="Pipeline Stage Distribution" description="All candidates by current stage" />
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8 }} />
                    <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                      {pipelineData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Group distribution */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: 20,
            }}>
              <SectionHeader title="Candidate Group Distribution" description="Evidence-based categorization" />
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', height: 220 }}>
                <PieChart width={160} height={160}>
                  <Pie
                    data={groupData}
                    cx={75}
                    cy={75}
                    innerRadius={48}
                    outerRadius={72}
                    dataKey="value"
                  >
                    {groupData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ flex: 1 }}>
                  {groupData.map(item => (
                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Role summaries */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-muted)' }}>
              <SectionHeader title="Active Role Summaries" />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-base)' }}>
                  {['Role', 'Stage', 'Candidates', 'Interviews', 'Strong Match', 'Needs Validation'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeJobs.map((job, i) => {
                  const jobCandidates = candidates.filter(c => c.jobId === job.id);
                  return (
                    <tr key={job.id} style={{ borderBottom: i < activeJobs.length - 1 ? '1px solid var(--border-muted)' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{job.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.department}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge color={stageColor[job.hiringStage.toLowerCase() as keyof typeof stageColor] ?? 'var(--text-muted)'} bg="var(--bg-muted)">
                          {job.hiringStage}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {jobCandidates.length}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {job.interviewCount}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--status-verified)', fontWeight: 600 }}>
                        {jobCandidates.filter(c => c.group === 'strong_match').length}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--status-validation)', fontWeight: 600 }}>
                        {jobCandidates.filter(c => c.validationNeeded).length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </AppShell>
  );
}

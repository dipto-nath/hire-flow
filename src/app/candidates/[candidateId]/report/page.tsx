// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Avatar, SectionHeader, CoverageBar, Divider } from '@/components/ui';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { formatDate, evidenceStatusLabel } from '@/lib/utils';
import { Edit, Save, ArrowLeft, AlertTriangle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { EvaluationRating, Evidence, EvidenceStatus, Requirement } from '@/types';

const ratingOptions: { value: EvaluationRating; label: string }[] = [
  { value: 'strong_evidence', label: 'Strong Evidence' },
  { value: 'meets_requirements', label: 'Meets Requirements' },
  { value: 'partially_meets', label: 'Partially Meets' },
  { value: 'needs_more_evidence', label: 'Needs More Evidence' },
  { value: 'does_not_meet', label: 'Does Not Meet Requirements' },
];

export default function EvaluationReportPage() {
  const params = useParams();
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.candidates.get(candidateId);
        setCandidate(data);
        setJob(data.job);
        setInterview(data.interviews?.[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (candidateId) fetchData();
  }, [candidateId]);

  const [assessment, setAssessment] = useState({
    overallRating: '' as EvaluationRating | '',
    strengths: '',
    concerns: '',
    additionalValidation: '',
    recommendation: '',
  });
  const [saved, setSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAutoGenerate = async () => {
    if (!interview) return;
    setIsGenerating(true);
    try {
      const report = await api.interviews.generateReport(interview.id, candidateId);
      if (report) {
        setAssessment(prev => ({
          ...prev,
          overallRating: report.overallRating || prev.overallRating,
          strengths: report.strengths || prev.strengths,
          concerns: report.concerns || prev.concerns,
          additionalValidation: report.additionalValidation || prev.additionalValidation,
          recommendation: report.recommendation || prev.recommendation,
        }));
      }
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Loading Report...">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading evaluation details...</p>
        </div>
      </AppShell>
    );
  }

  if (!candidate || !job) {
    return (
      <AppShell title="Evaluation Report">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Link href="/candidates" style={{ color: 'var(--accent)' }}>Back to Candidates</Link>
        </div>
      </AppShell>
    );
  }

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const confidenceLabel = (status: EvidenceStatus): string => {
    if (status === 'verified' || status === 'strong') return 'High';
    if (status === 'partial') return 'Medium';
    if (status === 'needs_validation') return 'Low';
    return 'None';
  };

  const confidenceColor = (status: EvidenceStatus): string => {
    if (status === 'verified' || status === 'strong') return 'var(--status-verified)';
    if (status === 'partial') return '#1d4ed8';
    if (status === 'needs_validation') return 'var(--status-validation)';
    return 'var(--status-notfound)';
  };

  const interviewNotes = interview?.notes ?? [];
  const unresolvedValidation = candidate.evidence.filter((e: Evidence) => e.status === 'needs_validation');

  return (
    <AppShell
      title="Evaluation Report"
      breadcrumbs={[
        { label: 'Candidates', href: '/candidates' },
        { label: candidate.name, href: `/candidates/${candidateId}` },
        { label: 'Evaluation Report' },
      ]}
    >
      <div style={{ padding: '24px 28px 64px', maxWidth: 900, margin: '0 auto' }}>

        {/* Report header */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          padding: 24,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Interview Evaluation
            </h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/candidates/${candidateId}/interview`}>
                <Button variant="ghost" size="sm"><ArrowLeft size={13} /> Back to Interview</Button>
              </Link>
              <Button variant="primary" size="sm" onClick={handleSave}>
                <Save size={13} /> {saved ? 'Saved!' : 'Save Report'}
              </Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Candidate
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={candidate.firstName?.[0] + (candidate.lastName?.[0] || '') || 'C'} color="var(--accent)" size={30} name={candidate.name} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{candidate.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.currentRole}</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Role
              </div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{job.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.department} · {job.location}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Interview Date
              </div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {interview?.completedAt ? formatDate(interview.completedAt) : 'Not yet conducted'}
              </div>
              {interview?.interviewers && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{interview.interviewers.join(', ')}</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Assist disclaimer */}
        <div style={{
          background: 'var(--bg-muted)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 20,
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <AlertTriangle size={14} color="var(--status-validation)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>AI assists evaluation. Recruiters make hiring decisions.</strong>{' '}
            Evidence and summaries below are drawn from available candidate materials. The recruiter assessment section must be completed by the interviewing team before a decision is made.
          </span>
        </div>

        {/* Requirement evaluation table */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-muted)' }}>
            <SectionHeader title="Evaluation Overview" description="Requirement-by-requirement evidence assessment" />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)' }}>
                {['Requirement', 'Type', 'Evidence', 'Confidence', 'Status', 'Source'].map(h => (
                  <th key={h} style={{
                    padding: '9px 16px', textAlign: 'left', fontSize: '0.6875rem',
                    fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em',
                    textTransform: 'uppercase', borderBottom: '1px solid var(--border-muted)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {job.requirements.map((req: Requirement, i: number) => {
                const evidence = candidate.evidence.find((e: Evidence) => e.requirementId === req.id);
                const status: EvidenceStatus = evidence?.status ?? 'not_found';
                return (
                  <tr
                    key={req.id}
                    style={{ borderBottom: i < job.requirements.length - 1 ? '1px solid var(--border-muted)' : 'none' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{req.label}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge
                        color={req.type === 'required' ? 'var(--accent)' : 'var(--text-muted)'}
                        bg={req.type === 'required' ? 'var(--accent-light)' : 'var(--bg-muted)'}
                      >
                        {req.type}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {evidence ? evidence.excerpt.slice(0, 100) + '...' : 'No evidence found.'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: confidenceColor(status) }}>
                        {confidenceLabel(status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={status} />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {evidence?.sourceLabel ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Interview Evidence */}
        {interviewNotes.length > 0 && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}>
            <SectionHeader title="Interview Evidence" description="Notes captured during the interview" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {interviewNotes.map(note => (
                <div key={note.id} style={{
                  padding: '12px 16px',
                  background: 'var(--bg-base)',
                  borderRadius: 8,
                  borderLeft: '3px solid var(--border-strong)',
                }}>
                  {note.questionText && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Q: {note.questionText.slice(0, 70)}...
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {note.content}
                  </p>
                  {note.requirementLabel && (
                    <div style={{ marginTop: 6 }}>
                      <Badge>{note.requirementLabel}</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outstanding Validation */}
        {unresolvedValidation.length > 0 && (
          <div style={{
            background: 'var(--status-validation-bg)',
            border: '1px solid var(--status-validation-border)',
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}>
            <SectionHeader
              title="Outstanding Validation"
              description="These requirements were not fully resolved and may need follow-up"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unresolvedValidation.map((ev: Evidence) => (
                <div key={ev.id} style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'var(--bg-surface)',
                  borderRadius: 7,
                }}>
                  <AlertTriangle size={14} color="var(--status-validation)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {ev.requirementId}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
                      {ev.excerpt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recruiter Assessment */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          padding: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <SectionHeader
              title="Recruiter Assessment"
              description="This section must be completed by the recruiting team. The final decision rests with the hiring manager."
            />
            <Button variant="secondary" size="sm" onClick={handleAutoGenerate} disabled={isGenerating}>
              <Lightbulb size={13} color="var(--accent)" /> 
              {isGenerating ? 'Analyzing...' : 'Auto-Generate Draft'}
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Overall rating */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Overall Assessment
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ratingOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAssessment(a => ({ ...a, overallRating: opt.value }))}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: `1px solid ${assessment.overallRating === opt.value ? 'var(--accent)' : 'var(--border-default)'}`,
                      background: assessment.overallRating === opt.value ? 'var(--accent-light)' : 'var(--bg-surface)',
                      color: assessment.overallRating === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: assessment.overallRating === opt.value ? 600 : 400,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text fields */}
            {[
              { key: 'strengths', label: 'Strengths', placeholder: 'What stood out positively about this candidate?' },
              { key: 'concerns', label: 'Concerns', placeholder: 'What gaps, risks, or concerns were identified?' },
              { key: 'additionalValidation', label: 'Additional Validation Needed', placeholder: 'What would you need to confirm before proceeding?' },
              { key: 'recommendation', label: 'Recommendation', placeholder: 'What is your recommendation for next steps?' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {field.label}
                </label>
                <textarea
                  value={assessment[field.key as keyof typeof assessment]}
                  onChange={e => setAssessment(a => ({ ...a, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-base)',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <Button variant="primary" size="md" onClick={handleSave}>
              <Save size={14} /> {saved ? 'Report Saved' : 'Save Assessment'}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

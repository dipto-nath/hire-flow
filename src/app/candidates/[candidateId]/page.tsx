'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Avatar, CoverageBar, Tabs, SectionHeader, Divider } from '@/components/ui';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockCandidates } from '@/mock-data/candidates';
import { mockJobs } from '@/mock-data/jobs';
import { mockInterviews } from '@/mock-data/interviews';
import { formatDate, groupLabel, groupColor, stageLabel, stageColor, evidenceStatusLabel } from '@/lib/utils';
import {
  MapPin, Briefcase, GraduationCap, CalendarCheck, FileText,
  ChevronRight, ExternalLink, Plus, MessageSquare, AlertTriangle,
  CheckCircle, HelpCircle, XCircle, Edit, ArrowRight, Clock,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { Evidence, EvidenceStatus, Requirement } from '@/types';

const profileTabs = [
  { key: 'coverage', label: 'Requirement Coverage' },
  { key: 'summary', label: 'Candidate Summary' },
  { key: 'evidence', label: 'Evidence' },
];

export default function CandidateProfilePage() {
  const params = useParams();
  const candidateId = params.candidateId as string;
  const [tab, setTab] = useState('coverage');
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);

  const candidate = mockCandidates.find(c => c.id === candidateId);
  const job = candidate ? mockJobs.find(j => j.id === candidate.jobId) : null;
  const interview = mockInterviews.find(i => i.candidateId === candidateId);

  if (!candidate || !job) {
    return (
      <AppShell title="Candidate not found">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>This candidate could not be found.</p>
          <Link href="/candidates" style={{ color: 'var(--accent)' }}>Back to Candidates</Link>
        </div>
      </AppShell>
    );
  }

  const { color: gc, bg: gbg } = groupColor[candidate.group];

  return (
    <AppShell
      title={candidate.name}
      breadcrumbs={[
        { label: 'Jobs', href: '/jobs' },
        { label: job.title, href: `/jobs/${job.id}` },
        { label: 'Candidates', href: `/jobs/${job.id}/candidates` },
        { label: candidate.name },
      ]}
    >
      {/* Profile Header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        padding: '20px 28px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <Avatar initials={candidate.initials} color={candidate.avatarColor} size={52} name={candidate.name} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {candidate.name}
              </h1>
              <Badge color={gc} bg={gbg}>{groupLabel[candidate.group]}</Badge>
              {candidate.groupOverridden && (
                <Badge color="var(--text-muted)" bg="var(--bg-muted)">Manually overridden</Badge>
              )}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {candidate.currentRole} · {candidate.currentCompany}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <MapPin size={13} /> {candidate.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <Briefcase size={13} /> {candidate.yearsExperience} years experience
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <GraduationCap size={13} /> {candidate.education}
              </span>
            </div>
          </div>
          {/* Coverage */}
          <div style={{
            textAlign: 'right',
            padding: '12px 16px',
            background: 'var(--bg-base)',
            borderRadius: 8,
            border: '1px solid var(--border-default)',
            minWidth: 160,
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, fontWeight: 600 }}>
              Requirement Coverage
            </div>
            <CoverageBar value={candidate.requirementCoverage} size="md" />
            {candidate.validationNeeded && (
              <div style={{ fontSize: '0.75rem', color: 'var(--status-validation)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={11} /> Validation needed
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Stage: <Badge color={stageColor[candidate.stage]} bg={`${stageColor[candidate.stage]}18`}>
              {stageLabel[candidate.stage]}
            </Badge>
          </div>
          <div style={{ flex: 1 }} />
          <Button variant="secondary" size="sm">
            <Edit size={13} /> Move Stage
          </Button>
          <Link href={`/candidates/${candidateId}/interview`}>
            <Button variant="secondary" size="sm">
              <CalendarCheck size={13} /> {interview ? 'View Interview' : 'Prepare Interview'}
            </Button>
          </Link>
          <Link href={`/candidates/${candidateId}/report`}>
            <Button variant="primary" size="sm">
              <FileText size={13} /> Evaluation Report
            </Button>
          </Link>
        </div>

        <Tabs tabs={profileTabs} active={tab} onChange={setTab} />
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px 28px 48px' }}>
        {tab === 'coverage' && (
          <RequirementCoverageTab candidate={candidate} job={job} expandedEvidence={expandedEvidence} setExpandedEvidence={setExpandedEvidence} />
        )}
        {tab === 'summary' && <SummaryTab candidate={candidate} />}
        {tab === 'evidence' && <EvidenceTab candidate={candidate} />}
      </div>
    </AppShell>
  );
}

// ─── Requirement Coverage Tab ─────────────────────────────────────────────────

function RequirementCoverageTab({ candidate, job, expandedEvidence, setExpandedEvidence }: {
  candidate: ReturnType<typeof mockCandidates.find> & {};
  job: ReturnType<typeof mockJobs.find> & {};
  expandedEvidence: string | null;
  setExpandedEvidence: (id: string | null) => void;
}) {
  if (!candidate || !job) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
      <div>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Role Requirement Mapping
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Each job requirement mapped against available candidate evidence.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {job.requirements.map((req: Requirement) => {
            const evidence = candidate.evidence.find((e: Evidence) => e.requirementId === req.id);
            const status: EvidenceStatus = evidence?.status ?? 'not_found';
            const isExpanded = expandedEvidence === req.id;

            return (
              <div
                key={req.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setExpandedEvidence(isExpanded ? null : req.id)}
                  aria-expanded={isExpanded}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <StatusBadge status={status} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {req.label}
                    </span>
                    {!isExpanded && evidence && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                        {evidence.excerpt.slice(0, 80)}...
                      </span>
                    )}
                  </div>
                  <Badge
                    color={req.type === 'required' ? 'var(--accent)' : 'var(--text-muted)'}
                    bg={req.type === 'required' ? 'var(--accent-light)' : 'var(--bg-muted)'}
                  >
                    {req.type}
                  </Badge>
                  {isExpanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border-muted)' }}>
                    {evidence ? (
                      <div style={{ paddingTop: 14 }}>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                            Evidence
                          </div>
                          <blockquote style={{
                            margin: 0,
                            padding: '10px 14px',
                            background: 'var(--bg-base)',
                            borderLeft: '3px solid var(--accent)',
                            borderRadius: '0 6px 6px 0',
                            fontSize: '0.8125rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.65,
                            fontStyle: 'italic',
                          }}>
                            &ldquo;{evidence.excerpt}&rdquo;
                          </blockquote>
                        </div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                              Source
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                              {evidence.sourceLabel}
                            </div>
                          </div>
                          {evidence.location && (
                            <div>
                              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                                Location
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                {evidence.location}
                              </div>
                            </div>
                          )}
                        </div>
                        {status === 'needs_validation' && (
                          <div style={{
                            marginTop: 14,
                            padding: '10px 14px',
                            background: 'var(--status-validation-bg)',
                            border: '1px solid var(--status-validation-border)',
                            borderRadius: 7,
                          }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-validation)', marginBottom: 4 }}>
                              ⚠ Validation Required
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              This requirement needs explicit confirmation in screening or interview.
                            </div>
                            <Button variant="secondary" size="sm" style={{ marginTop: 8 }}>
                              <Plus size={13} /> Add Validation Question
                            </Button>
                          </div>
                        )}
                        {status === 'not_found' && (
                          <div style={{
                            marginTop: 14,
                            padding: '10px 14px',
                            background: 'var(--bg-muted)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 7,
                          }}>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              No evidence found in available candidate materials. This gap should be addressed in interview preparation.
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '14px 0' }}>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          No evidence found for this requirement.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Quick status */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          padding: 18,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Evidence Summary
          </h3>
          {(['verified', 'strong', 'partial', 'needs_validation', 'not_found'] as EvidenceStatus[]).map(status => {
            const count = candidate.evidence.filter((e: Evidence) => e.status === status).length;
            if (count === 0) return null;
            return (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, alignItems: 'center' }}>
                <StatusBadge status={status} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Skills */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          padding: 18,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Skills
          </h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {candidate.skills.map((skill: string) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </div>

        {/* Interview */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          padding: 18,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Interview
          </h3>
          {candidate.interviewStatus ? (
            <div>
              <Badge
                color={candidate.interviewStatus === 'completed' ? 'var(--status-verified)' : 'var(--accent)'}
                bg={candidate.interviewStatus === 'completed' ? 'var(--status-verified-bg)' : 'var(--accent-light)'}
              >
                {candidate.interviewStatus.replace('_', ' ')}
              </Badge>
              <Link href={`/candidates/${candidate.id}/interview`} style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm" style={{ marginTop: 8 }}>
                  View interview <ChevronRight size={13} />
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                No interview scheduled.
              </p>
              <Link href={`/candidates/${candidate.id}/interview`} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  <CalendarCheck size={13} /> Prepare Interview
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────

function SummaryTab({ candidate }: { candidate: ReturnType<typeof mockCandidates.find> & {} }) {
  if (!candidate?.summary) return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      Candidate summary not yet generated.
    </div>
  );

  const s = candidate.summary;
  const sections = [
    { label: 'Overview', content: s.overview },
    { label: 'Experience', content: s.experience },
    { label: 'Skills', content: s.skills },
    { label: 'Projects', content: s.projects },
    { label: 'Education', content: s.education },
    { label: 'Domain Experience', content: s.domainExperience },
    { label: 'Potential Gaps', content: s.potentialGaps, isGap: true },
  ];

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{
        background: 'var(--status-notfound-bg)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 20,
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        This summary is generated from available candidate materials. AI assists evaluation — recruiters make hiring decisions.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections.map(section => (
          <div key={section.label}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: section.isGap ? 'var(--status-validation)' : 'var(--text-primary)' }}>
                {section.label}
              </h3>
              <Button variant="ghost" size="sm" style={{ fontSize: '0.6875rem', color: 'var(--accent)' }}>
                View evidence
              </Button>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              padding: section.isGap ? '10px 14px' : 0,
              background: section.isGap ? 'var(--status-validation-bg)' : 'transparent',
              borderRadius: section.isGap ? 7 : 0,
              border: section.isGap ? '1px solid var(--status-validation-border)' : 'none',
            }}>
              {section.content}
            </p>
            <Divider style={{ marginTop: 20 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evidence Tab ─────────────────────────────────────────────────────────────

function EvidenceTab({ candidate }: { candidate: ReturnType<typeof mockCandidates.find> & {} }) {
  if (!candidate) return null;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {candidate.evidence.map((ev: Evidence) => (
          <div key={ev.id} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            padding: 18,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <StatusBadge status={ev.status} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Requirement: <span style={{ color: 'var(--text-primary)' }}>{ev.requirementId}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {ev.sourceLabel}
              </div>
            </div>
            <blockquote style={{
              margin: 0,
              padding: '10px 14px',
              background: 'var(--bg-base)',
              borderLeft: '3px solid var(--border-strong)',
              borderRadius: '0 6px 6px 0',
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              lineHeight: 1.65,
            }}>
              {ev.excerpt}
            </blockquote>
            {ev.location && (
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                📍 {ev.location}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

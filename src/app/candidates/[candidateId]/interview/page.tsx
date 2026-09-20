// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Avatar, SectionHeader, Divider } from '@/components/ui';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  Plus, Flag, MessageSquare, CheckSquare, ArrowRight,
  Clock, ChevronRight, ChevronDown, X, Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { InterviewNote, InterviewQuestion } from '@/types';

export default function InterviewPage() {
  const params = useParams();
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [baseInterview, setBaseInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.candidates.get(candidateId);
        setCandidate(data);
        setJob(data.job);
        setBaseInterview(data.interviews?.[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (candidateId) fetchData();
  }, [candidateId]);

  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [notes, setNotes] = useState<InterviewNote[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [followUp, setFollowUp] = useState<{ question: string; why: string; whatToValidate: string } | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [addedQuestions, setAddedQuestions] = useState<Set<string>>(new Set());
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [mode, setMode] = useState<'prep' | 'live'>('prep');

  // Initialize state once data is loaded
  useEffect(() => {
    if (baseInterview) {
      if (baseInterview.questions?.length > 0 && !activeQuestion) {
        setActiveQuestion(baseInterview.questions[0].id);
      }
      setNotes(baseInterview.notes || []);
      setAddedQuestions(new Set(baseInterview.questions?.filter((q: any) => q.addedToInterview).map((q: any) => q.id) || []));
    }
  }, [baseInterview]);

  if (loading) {
    return (
      <AppShell title="Loading Interview...">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading interview details...</p>
        </div>
      </AppShell>
    );
  }

  if (!candidate || !job) {
    return (
      <AppShell title="Interview">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Link href="/candidates" style={{ color: 'var(--accent)' }}>Back to Candidates</Link>
        </div>
      </AppShell>
    );
  }

  const interview = baseInterview ?? {
    id: 'new',
    candidateId,
    jobId: job.id,
    status: 'scheduled' as const,
    interviewers: ['Alex Rivera'],
    questions: [],
    notes: [],
  };

  const allQuestions: InterviewQuestion[] = interview.questions.length > 0
    ? interview.questions
    : [
        {
          id: 'prep-q-1',
          text: 'Walk me through your React architecture experience. How have you structured large applications?',
          category: 'technical',
          requirementId: 'req-fe-1',
          requirementLabel: 'React',
          whyAsk: 'Validates depth of React production experience described in resume.',
          evidenceContext: 'Resume describes React-based merchant dashboard.',
          expectedEvidence: 'Clear architecture decisions, state management choice, rendering strategy.',
        },
        {
          id: 'prep-q-2',
          text: 'Describe your TypeScript experience in a production context.',
          category: 'technical',
          requirementId: 'req-fe-2',
          requirementLabel: 'TypeScript',
          whyAsk: 'Validates TypeScript claim in resume.',
          evidenceContext: 'TypeScript listed as primary skill.',
          expectedEvidence: 'Generics, strict mode, type-safe patterns.',
        },
        {
          id: 'prep-q-3',
          text: 'Tell me about a frontend performance problem you diagnosed and fixed.',
          category: 'technical',
          requirementId: 'req-fe-6',
          requirementLabel: 'Performance optimization',
          whyAsk: 'Preferred requirement. Resume mentions LCP improvement.',
          evidenceContext: '30% LCP improvement claim in resume.',
          expectedEvidence: 'Specific metrics, profiling tools, before/after comparison.',
        },
        {
          id: 'prep-q-4',
          text: 'You mentioned a Next.js migration. Can you describe the approach, challenges, and how you validated the outcome?',
          category: 'validation',
          requirementId: 'req-fe-5',
          requirementLabel: 'Next.js',
          whyAsk: 'Next.js mentioned in resume but needs depth validation.',
          evidenceContext: 'Resume: "Migrated to Next.js." Interview should establish ownership level.',
          expectedEvidence: 'ISR vs SSR decisions, routing approach, deployment considerations.',
        },
        {
          id: 'prep-q-5',
          text: 'How do you approach leading a frontend team? What processes do you put in place?',
          category: 'experience',
          requirementId: 'req-fe-8',
          requirementLabel: 'Team/tech leadership',
          whyAsk: 'Partial evidence for leadership — interview should establish scope.',
          evidenceContext: 'Resume mentions managing 4-person team but lacks detail.',
          expectedEvidence: 'RFC process, mentoring approach, technical decision ownership.',
        },
      ];

  const activeQ = allQuestions.find(q => q.id === activeQuestion) || allQuestions[0];

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    const newNote = {
      content: noteInput,
      type: 'note',
      questionId: activeQuestion ?? undefined,
      questionText: activeQ?.text,
    };
    
    // Optimistic UI update
    const tempNote: InterviewNote = {
      id: `temp-${Date.now()}`,
      ...newNote,
      timestamp: new Date().toISOString(),
    };
    setNotes(prev => [...prev, tempNote]);
    setNoteInput('');
    
    if (baseInterview && baseInterview.id !== 'new') {
      try {
        const savedNote = await api.interviews.addNote(baseInterview.id, newNote);
        setNotes(prev => prev.map(n => n.id === tempNote.id ? savedNote : n));
      } catch (err) {
        console.error('Failed to save note', err);
      }
    }
  };

  const handleGenerateFollowUp = async () => {
    if (!activeQ) return;
    setIsGeneratingFollowUp(true);
    await new Promise(r => setTimeout(r, 900));
    setFollowUp({
      question: `Can you be more specific about your ${activeQ.requirementLabel ?? 'experience'} — what was the specific challenge you encountered and how did you measure the outcome?`,
      why: `The candidate's answer touched on the topic but lacked specific metrics or a clear methodology. This follow-up will establish whether the claim is supported by concrete evidence.`,
      whatToValidate: 'Look for: specific numbers, tools used, approach taken, before/after comparison, and outcome. Generic answers should prompt deeper questioning.',
    });
    setShowFollowUp(true);
    setIsGeneratingFollowUp(false);
  };

  const categoryColors: Record<string, string> = {
    technical: '#1d4ed8',
    experience: '#065f46',
    project: '#7c2d12',
    validation: '#92400e',
    behavioral: '#6b21a8',
  };

  return (
    <AppShell
      title="Interview"
      breadcrumbs={[
        { label: 'Candidates', href: '/candidates' },
        { label: candidate.name, href: `/candidates/${candidateId}` },
        { label: 'Interview' },
      ]}
    >
      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {mode === 'prep' ? 'Interview Preparation' : 'Live Interview'}
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {candidate.name} · {job.title}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant={mode === 'prep' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMode('prep')}
          >
            Preparation
          </Button>
          <Button
            variant={mode === 'live' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMode('live')}
          >
            Live Interview
          </Button>
        </div>
      </div>

      {mode === 'prep' ? (
        // ─── Prep Mode ────────────────────────────────────────────────────────
        <div style={{ padding: '24px 24px 48px' }}>
          <div style={{ marginBottom: 20 }}>
            <SectionHeader
              title="Interview Focus"
              description="Generated based on job requirements, candidate resume, missing evidence, and validation gaps."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allQuestions.map((q, i) => {
                const isAdded = addedQuestions.has(q.id);
                return (
                  <div key={q.id} style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${activeQuestion === q.id ? 'var(--accent-muted)' : 'var(--border-default)'}`,
                    borderRadius: 10,
                    padding: 18,
                    cursor: 'pointer',
                    outline: activeQuestion === q.id ? '2px solid var(--accent-light)' : 'none',
                  }}
                    onClick={() => setActiveQuestion(q.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--bg-base)',
                        border: '1.5px solid var(--border-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                        marginTop: 1,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {q.text}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <Badge
                        color={categoryColors[q.category] ?? 'var(--text-muted)'}
                        bg={`${categoryColors[q.category] ?? '#6b7280'}15`}
                      >
                        {q.category}
                      </Badge>
                      {q.requirementLabel && (
                        <Badge>{q.requirementLabel}</Badge>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Why ask this: </span>
                      {q.whyAsk}
                    </div>

                    {q.evidenceContext && (
                      <div style={{
                        padding: '8px 12px',
                        background: 'var(--bg-base)',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: 10,
                        lineHeight: 1.5,
                      }}>
                        <span style={{ fontWeight: 600 }}>Context: </span>{q.evidenceContext}
                      </div>
                    )}

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Expected evidence: </span>
                      {q.expectedEvidence}
                    </div>

                    <Button
                      variant={isAdded ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        setAddedQuestions(prev => {
                          const next = new Set(prev);
                          if (next.has(q.id)) next.delete(q.id);
                          else next.add(q.id);
                          return next;
                        });
                      }}
                      style={{ color: isAdded ? 'var(--status-verified)' : undefined }}
                    >
                      {isAdded ? <CheckSquare size={13} /> : <Plus size={13} />}
                      {isAdded ? 'Added to interview' : 'Add to interview'}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: 18,
              }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '0.875rem', fontWeight: 600 }}>Interview Plan</h3>
                <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {addedQuestions.size} questions selected
                </p>
                {allQuestions.filter(q => addedQuestions.has(q.id)).map((q, i) => (
                  <div key={q.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 1 }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{q.text.slice(0, 70)}...</span>
                  </div>
                ))}
                <Button
                  variant="primary"
                  size="sm"
                  style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
                  onClick={() => setMode('live')}
                >
                  Start Interview <ArrowRight size={13} />
                </Button>
              </div>
              <div style={{
                background: 'var(--status-validation-bg)',
                border: '1px solid var(--status-validation-border)',
                borderRadius: 10,
                padding: 16,
              }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-validation)' }}>
                  Validation Focus
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {candidate.evidence.filter((e: { status: string }) => e.status === 'needs_validation').length} requirements need explicit validation.
                  Ensure these are addressed before closing the interview.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ─── Live Interview Mode ────────────────────────────────────────────────
        <div style={{ display: 'flex', height: 'calc(100vh - 112px)', overflow: 'hidden' }}>
          {/* Left panel */}
          <div style={{
            width: 340,
            borderRight: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-muted)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Candidate
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Avatar initials={candidate.firstName?.[0] + (candidate.lastName?.[0] || '') || 'C'} color="var(--accent)" size={36} name={candidate.name} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.currentRole}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 0', flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '0 18px 8px', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Questions
              </div>
              {allQuestions.filter(q => addedQuestions.has(q.id) || allQuestions.indexOf(q) < 5).map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestion(q.id)}
                  style={{
                    width: '100%',
                    padding: '10px 18px',
                    textAlign: 'left',
                    background: activeQuestion === q.id ? 'var(--accent-light)' : 'transparent',
                    border: 'none',
                    borderLeft: activeQuestion === q.id ? '3px solid var(--accent)' : '3px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 700,
                      color: activeQuestion === q.id ? 'var(--accent)' : 'var(--text-faint)',
                      flexShrink: 0, paddingTop: 2,
                    }}>
                      Q{i + 1}
                    </span>
                    <span style={{
                      fontSize: '0.8125rem',
                      color: activeQuestion === q.id ? 'var(--accent-hover)' : 'var(--text-primary)',
                      fontWeight: activeQuestion === q.id ? 500 : 400,
                      lineHeight: 1.4,
                    }}>
                      {q.text.slice(0, 60)}...
                    </span>
                  </div>
                  {q.requirementLabel && (
                    <div style={{ marginTop: 3, paddingLeft: 20 }}>
                      <Badge>{q.requirementLabel}</Badge>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Active question */}
            {activeQ && (
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Badge color={categoryColors[activeQ.category]} bg={`${categoryColors[activeQ.category]}15`}>
                    {activeQ.category}
                  </Badge>
                  {activeQ.requirementLabel && <Badge>{activeQ.requirementLabel}</Badge>}
                </div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {activeQ.text}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {activeQ.whyAsk}
                </p>
              </div>
            )}

            {/* Notes area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '18px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAddNote(); }}
                  placeholder="Type your interview note here... (⌘ + Enter to save)"
                  aria-label="Interview note input"
                  style={{
                    width: '100%',
                    minHeight: 120,
                    padding: 14,
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.6,
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Button variant="primary" size="sm" onClick={handleAddNote}>
                    <Plus size={13} /> Add Note
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateFollowUp}
                    disabled={isGeneratingFollowUp}
                  >
                    <Lightbulb size={13} />
                    {isGeneratingFollowUp ? 'Generating...' : 'Generate Follow-up'}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Flag size={13} /> Flag for Follow-up
                  </Button>
                  <Button variant="ghost" size="sm">
                    <CheckSquare size={13} /> Mark Requirement Covered
                  </Button>
                </div>
              </div>

              {/* Follow-up panel */}
              {showFollowUp && followUp && (
                <div style={{
                  background: 'var(--accent-light)',
                  border: '1px solid var(--accent-muted)',
                  borderRadius: 10,
                  padding: 18,
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Lightbulb size={14} color="var(--accent)" />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent)' }}>
                        Follow-up Suggested
                      </span>
                    </div>
                    <button onClick={() => setShowFollowUp(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                      <X size={15} />
                    </button>
                  </div>
                  <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    &ldquo;{followUp.question}&rdquo;
                  </p>
                  <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 500 }}>Why this matters: </span>{followUp.why}
                  </p>
                  <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 500 }}>What to validate: </span>{followUp.whatToValidate}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" size="sm" onClick={() => setShowFollowUp(false)}>Use Question</Button>
                    <Button variant="secondary" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowFollowUp(false)}>Dismiss</Button>
                  </div>
                </div>
              )}

              {/* Existing notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.map(note => (
                  <div key={note.id} style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: '12px 16px',
                  }}>
                    {note.questionText && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                        Re: {note.questionText.slice(0, 60)}...
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {note.content}
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-faint)' }}>
                        {formatDateTime(note.timestamp)}
                      </span>
                      {note.flaggedForFollowUp && (
                        <Badge color="var(--status-validation)" bg="var(--status-validation-bg)">
                          <Flag size={9} /> Follow-up needed
                        </Badge>
                      )}
                      {note.requirementLabel && (
                        <Badge>{note.requirementLabel}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interview controls */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {notes.length} notes recorded
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/candidates/${candidateId}/report`}>
                  <Button variant="primary" size="sm">
                    Generate Evaluation Report <ArrowRight size={13} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

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
  Clock, ChevronRight, ChevronDown, X, Lightbulb
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
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [coveredRequirements, setCoveredRequirements] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'prep' | 'live'>('prep');
  const [prepQuestions, setPrepQuestions] = useState<InterviewQuestion[]>([]);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [customQuestionText, setCustomQuestionText] = useState('');

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

  const allQuestions: InterviewQuestion[] = (baseInterview && baseInterview.questions?.length > 0)
    ? baseInterview.questions
    : prepQuestions;

  const handleGeneratePrep = async () => {
    setIsGeneratingPrep(true);
    try {
      const res = await api.interviews.generatePrep(candidateId, job.id, numQuestions);
      if (res.questions) {
        // Map API response to valid shape
        const generated = res.questions.map((q: any, i: number) => ({
          ...q,
          id: `prep-q-${Date.now()}-${i}`
        }));
        setPrepQuestions(generated);
      }
    } catch (err) {
      console.error('Failed to generate prep questions', err);
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  const handleAddCustomQuestion = () => {
    if (!customQuestionText.trim()) return;
    const newQ: InterviewQuestion = {
      id: `custom-q-${Date.now()}`,
      interviewId: 'new',
      text: customQuestionText,
      category: 'technical',
      whyAsk: 'Manually added by interviewer',
      addedToInterview: true,
      createdAt: new Date(),
      evidenceContext: null,
      expectedEvidence: null,
      requirementId: null,
      requirementLabel: null,
    };
    setPrepQuestions(prev => [...prev, newQ]);
    setAddedQuestions(prev => new Set(prev).add(newQ.id));
    setCustomQuestionText('');
  };

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

  const handleStartInterview = async () => {
    if (baseInterview && baseInterview.id !== 'new') {
      setMode('live');
      return;
    }
    
    setIsSaving(true);
    try {
      const selectedQuestions = allQuestions.filter(q => addedQuestions.has(q.id)).map(q => ({
        text: q.text,
        category: q.category,
        requirementId: q.requirementId,
        requirementLabel: q.requirementLabel,
        whyAsk: q.whyAsk,
        evidenceContext: q.evidenceContext,
        expectedEvidence: q.expectedEvidence,
        addedToInterview: true,
      }));
      
      const res = await api.interviews.create({
        candidateId,
        jobId: job.id,
        questions: selectedQuestions,
        scheduledAt: new Date().toISOString()
      });
      
      setBaseInterview(res);
      setMode('live');
    } catch (err) {
      console.error('Failed to save interview', err);
      alert('Failed to save interview. See console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    if (!activeQ || !baseInterview || baseInterview.id === 'new') {
      alert("Please save or start a real interview session first to generate AI follow-ups.");
      return;
    }
    if (!noteInput.trim()) {
      alert("Please type an interview note first so the AI can generate a follow-up question based on it.");
      return;
    }
    setIsGeneratingFollowUp(true);
    try {
      const res = await api.interviews.generateFollowUp(
        baseInterview.id, 
        noteInput, 
        activeQ.requirementLabel || 'Experience', 
        activeQ.requirementId
      );
      setFollowUp(res);
      setShowFollowUp(true);
    } catch (err) {
      console.error('Failed to generate follow up', err);
    } finally {
      setIsGeneratingFollowUp(false);
    }
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
              {allQuestions.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10 }}>
                  <Lightbulb size={32} color="var(--accent)" style={{ marginBottom: 16 }} />
                  <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>No Interview Plan Generated</h3>
                  <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Generate a personalized interview plan using HireFlow AI based on {candidate.name}'s resume gaps.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                    <select
                      value={numQuestions}
                      onChange={e => setNumQuestions(Number(e.target.value))}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-default)', fontSize: '0.875rem' }}
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                    </select>
                    <Button variant="primary" onClick={handleGeneratePrep} disabled={isGeneratingPrep}>
                      {isGeneratingPrep ? 'Generating...' : 'Generate Interview Plan with AI'}
                    </Button>
                  </div>
                </div>
              ) : allQuestions.map((q, i) => {
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
              {allQuestions.length > 0 && (
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: 18,
                }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.875rem' }}>Add Custom Question</h3>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      placeholder="Type a custom interview question..."
                      value={customQuestionText}
                      onChange={e => setCustomQuestionText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCustomQuestion()}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid var(--border-muted)',
                        borderRadius: 6,
                        fontSize: '0.875rem',
                      }}
                    />
                    <Button variant="secondary" onClick={handleAddCustomQuestion}>
                      <Plus size={14} /> Add
                    </Button>
                  </div>
                </div>
              )}
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
                  onClick={handleStartInterview}
                  disabled={isSaving}
                >
                  {isSaving ? 'Starting...' : 'Start Interview'} <ArrowRight size={13} />
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
                  <Button
                    variant={activeQ && flaggedQuestions.has(activeQ.id) ? 'danger' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      if (!activeQ) return;
                      setFlaggedQuestions(prev => {
                        const next = new Set(prev);
                        if (next.has(activeQ.id)) next.delete(activeQ.id);
                        else next.add(activeQ.id);
                        return next;
                      });
                    }}
                    style={activeQ && flaggedQuestions.has(activeQ.id) ? { background: '#fef2f2', color: '#dc2626' } : {}}
                  >
                    <Flag size={13} /> {activeQ && flaggedQuestions.has(activeQ.id) ? 'Flagged' : 'Flag for Follow-up'}
                  </Button>
                  <Button
                    variant={activeQ?.requirementId && coveredRequirements.has(activeQ.requirementId) ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      if (!activeQ || !activeQ.requirementId) {
                        alert('This question is not tied to a specific requirement.');
                        return;
                      }
                      setCoveredRequirements(prev => {
                        const next = new Set(prev);
                        if (next.has(activeQ.requirementId!)) next.delete(activeQ.requirementId!);
                        else next.add(activeQ.requirementId!);
                        return next;
                      });
                    }}
                    style={activeQ?.requirementId && coveredRequirements.has(activeQ.requirementId) ? { background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' } : {}}
                  >
                    <CheckSquare size={13} /> {activeQ?.requirementId && coveredRequirements.has(activeQ.requirementId) ? 'Requirement Covered' : 'Mark Requirement Covered'}
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

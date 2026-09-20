'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/index';
import {
  Mic, MicOff, AlertTriangle, CheckCircle, Activity,
  Radio, Zap, TrendingUp, MessageSquare, Cpu
} from 'lucide-react';

interface LivePayload {
  transcript_chunk: string;
  full_transcript: string;
  score: number;
  guidance: string[];
  risk_detected: boolean;
}

type GuidanceEntry = { type: 'summary' | 'feedback' | 'action' | 'raw'; text: string };

function parseGuidance(tips: string[]): GuidanceEntry[] {
  return tips.map(tip => {
    if (tip.startsWith('Summary:')) return { type: 'summary', text: tip.replace('Summary:', '').trim() };
    if (tip.startsWith('Feedback:')) return { type: 'feedback', text: tip.replace('Feedback:', '').trim() };
    if (tip.startsWith('Action:')) return { type: 'action', text: tip.replace('Action:', '').trim() };
    return { type: 'raw', text: tip };
  });
}

const guidanceStyle: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  summary: {
    color: 'var(--accent)',
    bg: 'var(--accent-light)',
    border: 'var(--accent-muted)',
    icon: <Cpu size={13} />,
  },
  feedback: {
    color: 'var(--status-verified)',
    bg: 'var(--status-verified-bg)',
    border: 'var(--status-verified-border)',
    icon: <CheckCircle size={13} />,
  },
  action: {
    color: '#92400e',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: <Zap size={13} />,
  },
  raw: {
    color: 'var(--text-secondary)',
    bg: 'var(--bg-muted)',
    border: 'var(--border-default)',
    icon: <MessageSquare size={13} />,
  },
};

function ScoreRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);
  const color =
    score >= 75 ? 'var(--status-verified)' :
    score >= 45 ? '#d97706' :
    score > 0   ? '#dc2626' :
    'var(--border-strong)';

  return (
    <svg width={112} height={112} viewBox="0 0 112 112">
      <circle cx={56} cy={56} r={radius} fill="none" stroke="var(--border-muted)" strokeWidth={8} />
      <circle
        cx={56} cy={56} r={radius} fill="none"
        stroke={color} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        strokeDashoffset={circumference * 0.25}
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
      />
      <text x={56} y={52} textAnchor="middle" fontSize={22} fontWeight={700} fill={color} fontFamily="Inter, sans-serif">
        {score}
      </text>
      <text x={56} y={68} textAnchor="middle" fontSize={10} fill="var(--text-muted)" fontFamily="Inter, sans-serif">
        / 100
      </text>
    </svg>
  );
}

function PulsingDot({ active }: { active: boolean }) {
  if (!active) return (
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)', display: 'inline-block' }} />
  );
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
      <span style={{
        position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#ef4444',
        opacity: 0.4, animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', position: 'relative' }} />
      <style>{`@keyframes ping { 75%,100%{transform:scale(2);opacity:0} }`}</style>
    </span>
  );
}

export default function LiveCallPage() {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [transcript, setTranscript] = useState<{ speaker: 'Interviewer' | 'Interviewee'; text: string }[]>([]);
  const [performanceScore, setPerformanceScore] = useState<number>(0);
  const [guidance, setGuidance] = useState<string[]>([]);
  const [riskDetected, setRiskDetected] = useState<boolean>(false);
  const [language] = useState<string>('en');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startCall = async () => {
    try {
      const tabStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      tabStream.getVideoTracks().forEach(t => t.stop());
      if (tabStream.getAudioTracks().length === 0) {
        alert("Please check 'Share tab audio' in the popup to capture the interviewee's audio.");
        tabStream.getTracks().forEach(t => t.stop());
        return;
      }

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const combinedStream = new MediaStream([...tabStream.getTracks(), ...micStream.getTracks()]);
      setStream(combinedStream);

      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:3001';
      const ws = new WebSocket(`${wsUrl}/api/live/stream`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data: LivePayload = JSON.parse(event.data);
          if (data.score !== undefined) setPerformanceScore(data.score);
          if (data.guidance) setGuidance(data.guidance);
          if (data.risk_detected !== undefined) setRiskDetected(data.risk_detected);
        } catch (e) {
          console.error('Failed to parse ws message', e);
        }
      };

      const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';
      const dialogueLog: { speaker: 'Interviewee' | 'Interviewer'; text: string }[] = [];

      const setupDeepgramStream = (
        audioStream: MediaStream,
        speakerLabel: 'Interviewee' | 'Interviewer',
        langCode: string
      ) => {
        if (!DEEPGRAM_API_KEY) {
          console.warn(`[Mock Mode] No Deepgram API Key. Simulating ${speakerLabel}...`);
          const mockInterval = setInterval(() => {
            const mockText = speakerLabel === 'Interviewer'
              ? 'Can you explain how this works?'
              : 'Sure, let me break it down for you.';
            dialogueLog.push({ speaker: speakerLabel, text: mockText });
            setTranscript([...dialogueLog]);
            const combined = dialogueLog.map(t => `[${t.speaker}]: ${t.text}`).join('\n');
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ full_transcript: combined }));
            }
          }, 6000);
          return { stop: () => clearInterval(mockInterval) };
        }

        const model = langCode === 'bn' ? 'general' : 'nova-2';
        const dgWs = new WebSocket(
          `wss://api.deepgram.com/v1/listen?model=${model}&language=${langCode}`,
          ['token', DEEPGRAM_API_KEY]
        );
        let recorder: MediaRecorder | null = null;

        dgWs.onopen = () => {
          recorder = new MediaRecorder(audioStream);
          recorder.addEventListener('dataavailable', e => {
            if (e.data.size > 0 && dgWs.readyState === 1) dgWs.send(e.data);
          });
          recorder.start(250);
        };
        dgWs.onerror = (e) => console.error(`Deepgram error (${speakerLabel})`, e);
        dgWs.onmessage = (msg) => {
          const received = JSON.parse(msg.data);
          const chunk = received.channel?.alternatives[0]?.transcript;
          if (chunk && received.is_final && chunk.trim().length > 0) {
            dialogueLog.push({ speaker: speakerLabel, text: chunk.trim() });
            setTranscript([...dialogueLog]);
            const combined = dialogueLog.map(t => `[${t.speaker}]: ${t.text}`).join('\n');
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ full_transcript: combined }));
            }
          }
        };

        return {
          stop: () => {
            if (recorder?.state === 'recording') recorder.stop();
            if (dgWs.readyState === 1) dgWs.close();
          },
        };
      };

      ws.onopen = () => {
        setIsActive(true);
        const intervieweeLoop = setupDeepgramStream(tabStream, 'Interviewee', language);
        const interviewerLoop = setupDeepgramStream(micStream, 'Interviewer', language);
        (ws as any).loops = [intervieweeLoop, interviewerLoop];
      };
    } catch (err: any) {
      console.error('Failed to start live call:', err);
      alert(`Could not start: ${err?.message || 'Unknown error.'}`);
    }
  };

  const stopCall = () => {
    const loops = (wsRef.current as any)?.loops || [];
    loops.forEach((l: any) => l?.stop?.());
    wsRef.current?.close();
    stream?.getTracks().forEach(t => t.stop());
    setIsActive(false);
  };

  useEffect(() => () => { stopCall(); }, []);

  const parsedGuidance = parseGuidance(guidance);

  return (
    <AppShell title="Live Assessment" breadcrumbs={[{ label: 'Interviews', href: '/interviews' }, { label: 'Live Assessment' }]}>
      <div style={{ padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PulsingDot active={isActive} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Interview Assessment
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {isActive ? 'Session active — transcribing both speakers in real-time' : 'Real-time STT & Gemini AI evaluation'}
              </p>
            </div>
          </div>
          <Button
            onClick={isActive ? stopCall : startCall}
            variant={isActive ? 'danger' : 'primary'}
            size="sm"
          >
            {isActive
              ? <><MicOff size={14} style={{ marginRight: 6 }} />End Session</>
              : <><Mic size={14} style={{ marginRight: 6 }} />Start Live Assessment</>
            }
          </Button>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, flex: 1, minHeight: 0 }}>

          {/* Transcript Panel */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border-muted)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-elevated)',
            }}>
              <Activity size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Live Transcription</span>
              {isActive && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 600,
                  color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 20, padding: '2px 8px', letterSpacing: '0.04em',
                }}>● LIVE</span>
              )}
            </div>
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {transcript.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--text-faint)', gap: 8, height: '100%'
                }}>
                  <Radio size={28} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: '0.8125rem' }}>Start a session to begin live transcription</span>
                </div>
              ) : (
                transcript.map((line, i) => {
                  const isInterviewer = line.speaker === 'Interviewer';
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isInterviewer ? 'flex-end' : 'flex-start',
                      animation: 'fadeIn 0.2s ease-out',
                    }}>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em',
                        color: isInterviewer ? 'var(--accent)' : 'var(--text-muted)',
                        marginBottom: 3, paddingInline: 4,
                        textTransform: 'uppercase',
                      }}>
                        {line.speaker}
                      </span>
                      <div style={{
                        maxWidth: '80%', padding: '8px 12px', borderRadius: 10,
                        fontSize: '0.8125rem', lineHeight: 1.5,
                        background: isInterviewer ? 'var(--accent-light)' : 'var(--bg-muted)',
                        color: isInterviewer ? 'var(--accent-hover)' : 'var(--text-primary)',
                        border: `1px solid ${isInterviewer ? 'var(--accent-muted)' : 'var(--border-muted)'}`,
                        borderBottomRightRadius: isInterviewer ? 2 : 10,
                        borderBottomLeftRadius: isInterviewer ? 10 : 2,
                      }}>
                        {line.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Score */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid var(--border-muted)',
                background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <TrendingUp size={13} style={{ color: 'var(--status-verified)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)' }}>Performance Score</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px' }}>
                <ScoreRing score={performanceScore} />
                <p style={{
                  margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)',
                  textAlign: 'center', lineHeight: 1.5,
                }}>
                  {performanceScore === 0 ? 'Awaiting transcript…' :
                   performanceScore >= 75 ? 'Strong performance' :
                   performanceScore >= 45 ? 'Needs improvement' : 'Struggling — consider hints'}
                </p>
              </div>
            </div>

            {/* AI Guidance */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 12, overflow: 'hidden', flex: 1,
            }}>
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid var(--border-muted)',
                background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <Cpu size={13} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)' }}>AI Guidance</span>
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {riskDetected && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-border)',
                    borderRadius: 8, padding: '8px 10px',
                  }}>
                    <AlertTriangle size={13} style={{ color: 'var(--status-warning)', marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-warning)', lineHeight: 1.4 }}>
                      Candidate appears stuck. Consider offering a hint.
                    </span>
                  </div>
                )}
                {parsedGuidance.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '28px 12px',
                    color: 'var(--text-faint)', fontSize: '0.78rem',
                  }}>
                    AI insights will appear after your first transcript.
                  </div>
                ) : (
                  parsedGuidance.map((g, i) => {
                    const s = guidanceStyle[g.type] || guidanceStyle.raw;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        background: s.bg, border: `1px solid ${s.border}`,
                        borderRadius: 8, padding: '8px 10px',
                        animation: 'fadeIn 0.3s ease-out',
                      }}>
                        <span style={{ color: s.color, marginTop: 1, flexShrink: 0 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.06em', color: s.color, display: 'block', marginBottom: 2,
                          }}>
                            {g.type === 'raw' ? 'Note' : g.type}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                            {g.text}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}

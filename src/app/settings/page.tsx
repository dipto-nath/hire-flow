'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, Button, SectionHeader, Tabs } from '@/components/ui';
import { Save, Bell, Shield, Users, Sliders, Building2 } from 'lucide-react';

const settingsTabs = [
  { key: 'workspace', label: 'Workspace' },
  { key: 'team', label: 'Team' },
  { key: 'evaluation', label: 'Evaluation Preferences' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'privacy', label: 'Data & Privacy' },
];

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px', border: '1px solid var(--border-default)',
          borderRadius: 8, fontSize: '0.875rem', color: 'var(--text-primary)',
          background: 'var(--bg-base)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid var(--border-muted)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {description && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? 'var(--accent)' : 'var(--border-strong)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.15s ease',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: checked ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('workspace');
  const [saved, setSaved] = useState(false);
  const [ws, setWs] = useState({ name: 'Acme Corp Recruiting', timezone: 'America/New_York', language: 'English' });
  const [notifs, setNotifs] = useState({
    resumeProcessed: true,
    validationNeeded: true,
    interviewComplete: true,
    evaluationPending: false,
    weeklyDigest: true,
  });
  const [evalPrefs, setEvalPrefs] = useState({
    requireEvidence: true,
    showGroupDisclaimer: true,
    requireAssessment: true,
    auditAllInsights: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell title="Settings" breadcrumbs={[{ label: 'Settings' }]}>
      <div>
        <PageHeader
          title="Settings"
          subtitle="Manage your workspace, team, and evaluation preferences"
          actions={
            <Button variant="primary" size="md" onClick={handleSave}>
              <Save size={14} /> {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          }
        />

        <div style={{ display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{
            width: 200,
            borderRight: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
            padding: '16px 0',
            flexShrink: 0,
            minHeight: 'calc(100vh - 120px)',
          }}>
            {settingsTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: 'flex',
                  width: '100%',
                  padding: '10px 20px',
                  fontSize: '0.8125rem',
                  fontWeight: tab === t.key ? 600 : 400,
                  color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
                  background: tab === t.key ? 'var(--accent-light)' : 'transparent',
                  border: 'none',
                  borderLeft: tab === t.key ? '3px solid var(--accent)' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '24px 32px 64px', maxWidth: 640 }}>
            {tab === 'workspace' && (
              <div>
                <SectionHeader title="Workspace Settings" description="Configure your organization's HireFlow workspace." />
                <Field label="Workspace name" value={ws.name} onChange={v => setWs(p => ({ ...p, name: v }))} />
                <Field label="Default timezone" value={ws.timezone} onChange={v => setWs(p => ({ ...p, timezone: v }))} />
                <Field label="Language" value={ws.language} onChange={v => setWs(p => ({ ...p, language: v }))} />
              </div>
            )}

            {tab === 'team' && (
              <div>
                <SectionHeader title="Team Members" description="Manage who has access to this workspace." />
                {[
                  { name: 'Alex Rivera', email: 'alex.rivera@acme.com', role: 'Admin' },
                  { name: 'Jordan Kim', email: 'jordan.kim@acme.com', role: 'Recruiter' },
                  { name: 'Taylor Reyes', email: 'taylor.reyes@acme.com', role: 'Hiring Manager' },
                ].map(member => (
                  <div key={member.email} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-muted)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{member.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 500, padding: '3px 10px',
                      borderRadius: 5, background: 'var(--bg-muted)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-default)',
                    }}>
                      {member.role}
                    </span>
                  </div>
                ))}
                <Button variant="secondary" size="sm" style={{ marginTop: 16 }}>
                  <Users size={13} /> Invite team member
                </Button>
              </div>
            )}

            {tab === 'evaluation' && (
              <div>
                <SectionHeader title="Evaluation Preferences" description="Configure how HireFlow presents and captures evaluations." />
                <Toggle
                  label="Require evidence for all requirements"
                  description="Warn recruiters when requirements have no evidence before marking evaluated."
                  checked={evalPrefs.requireEvidence}
                  onChange={v => setEvalPrefs(p => ({ ...p, requireEvidence: v }))}
                />
                <Toggle
                  label="Show group disclaimer on candidate profiles"
                  description="Display the message: 'Groups are based on available evidence and role requirements.'"
                  checked={evalPrefs.showGroupDisclaimer}
                  onChange={v => setEvalPrefs(p => ({ ...p, showGroupDisclaimer: v }))}
                />
                <Toggle
                  label="Require recruiter assessment before finalizing"
                  description="Block report submission until the recruiter assessment section is completed."
                  checked={evalPrefs.requireAssessment}
                  onChange={v => setEvalPrefs(p => ({ ...p, requireAssessment: v }))}
                />
                <Toggle
                  label="Audit all AI-generated insights"
                  description="Log every HireFlow-generated insight with its evidence trace and reasoning context."
                  checked={evalPrefs.auditAllInsights}
                  onChange={v => setEvalPrefs(p => ({ ...p, auditAllInsights: v }))}
                />
              </div>
            )}

            {tab === 'notifications' && (
              <div>
                <SectionHeader title="Notification Preferences" />
                <Toggle
                  label="Resume processing complete"
                  description="Notify when a batch of resumes finishes processing."
                  checked={notifs.resumeProcessed}
                  onChange={v => setNotifs(p => ({ ...p, resumeProcessed: v }))}
                />
                <Toggle
                  label="Candidate validation needed"
                  description="Alert when a candidate has unresolved validation requirements."
                  checked={notifs.validationNeeded}
                  onChange={v => setNotifs(p => ({ ...p, validationNeeded: v }))}
                />
                <Toggle
                  label="Interview completed"
                  description="Notify when an interview is marked as completed."
                  checked={notifs.interviewComplete}
                  onChange={v => setNotifs(p => ({ ...p, interviewComplete: v }))}
                />
                <Toggle
                  label="Evaluation pending"
                  description="Remind when evaluation reports are overdue."
                  checked={notifs.evaluationPending}
                  onChange={v => setNotifs(p => ({ ...p, evaluationPending: v }))}
                />
                <Toggle
                  label="Weekly hiring digest"
                  description="Receive a weekly summary of hiring activity across all active roles."
                  checked={notifs.weeklyDigest}
                  onChange={v => setNotifs(p => ({ ...p, weeklyDigest: v }))}
                />
              </div>
            )}

            {tab === 'privacy' && (
              <div>
                <SectionHeader title="Data & Privacy" description="Control how candidate data is stored and processed." />
                <div style={{ padding: '16px', background: 'var(--bg-muted)', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    HireFlow processes candidate data to generate evidence analysis and interview preparation materials. All processing is logged in the Audit Trail for transparency.
                  </div>
                </div>
                <Toggle
                  label="Retain audit logs indefinitely"
                  description="Keep all audit events permanently. Disabling this will apply a 12-month retention policy."
                  checked={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Allow data export"
                  description="Team members can export candidate data and reports."
                  checked={true}
                  onChange={() => {}}
                />
                <Button variant="danger" size="sm" style={{ marginTop: 24 }}>
                  <Shield size={13} /> Request data deletion
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, SectionHeader } from '@/components/ui';
import { Plus, X, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';

interface RequirementItem {
  id: string;
  type: 'required' | 'preferred';
  label: string;
  category: string;
}

const steps = [
  { num: 1, label: 'Job Description' },
  { num: 2, label: 'Requirements' },
  { num: 3, label: 'Review' },
];

export default function CreateJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    department: '',
    location: '',
    employmentType: 'full_time',
    experienceLevel: 'senior',
    description: '',
  });

  const [requirements, setRequirements] = useState<RequirementItem[]>([
    { id: '1', type: 'required', label: 'React', category: 'skill' },
    { id: '2', type: 'required', label: 'TypeScript', category: 'skill' },
  ]);
  const [newReqLabel, setNewReqLabel] = useState('');
  const [newReqType, setNewReqType] = useState<'required' | 'preferred'>('required');

  const addRequirement = () => {
    if (!newReqLabel.trim()) return;
    setRequirements(r => [...r, {
      id: Date.now().toString(),
      type: newReqType,
      label: newReqLabel.trim(),
      category: 'skill',
    }]);
    setNewReqLabel('');
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requirements: requirements.map(r => ({
            type: r.type,
            category: r.category,
            label: r.label,
          }))
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create job');
      }

      const data = await res.json();
      router.push(`/jobs/${data.id}`);
    } catch (error) {
      console.error(error);
      alert('Error creating job. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell title="Create Job" breadcrumbs={[{ label: 'Jobs', href: '/jobs' }, { label: 'Create Job' }]}>
      <div style={{ padding: '28px 28px 64px', maxWidth: 760, margin: '0 auto' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, alignItems: 'center' }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: step > s.num ? 'var(--status-verified)' : step === s.num ? 'var(--accent)' : 'var(--bg-muted)',
                  color: step >= s.num ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {step > s.num ? <CheckCircle size={15} /> : s.num}
                </div>
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: step === s.num ? 600 : 400,
                  color: step === s.num ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > s.num ? 'var(--status-verified)' : 'var(--border-default)', margin: '0 16px', minWidth: 40 }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <SectionHeader title="Job Description" description="Define the role basics and paste or write the job description." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[
                { key: 'title', label: 'Job Title', placeholder: 'e.g. Senior Frontend Engineer' },
                { key: 'department', label: 'Department', placeholder: 'e.g. Engineering' },
                { key: 'location', label: 'Location', placeholder: 'e.g. Remote (US)' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)', background: 'var(--bg-base)' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Employment Type
                </label>
                <select
                  value={form.employmentType}
                  onChange={e => setForm(p => ({ ...p, employmentType: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Experience Level
                </label>
                <select
                  value={form.experienceLevel}
                  onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead / Principal</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Job Description
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Paste or write the full job description here. HireFlow will use this to extract requirements and evaluate candidates."
                rows={10}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--bg-base)' }}
              />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <SectionHeader title="Requirements" description="Define structured requirements for this role. These will be used to evaluate all candidates." />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Required ({requirements.filter(r => r.type === 'required').length})
              </div>
              {requirements.filter(r => r.type === 'required').map(req => (
                <div key={req.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <Badge color="var(--accent)" bg="var(--accent-light)">{req.label}</Badge>
                  <button onClick={() => setRequirements(r => r.filter(x => x.id !== req.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Preferred ({requirements.filter(r => r.type === 'preferred').length})
              </div>
              {requirements.filter(r => r.type === 'preferred').map(req => (
                <div key={req.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <Badge>{req.label}</Badge>
                  <button onClick={() => setRequirements(r => r.filter(x => x.id !== req.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add requirement */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: 16,
            }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Add Requirement
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={newReqType}
                  onChange={e => setNewReqType(e.target.value as 'required' | 'preferred')}
                  style={{ padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 7, fontSize: '0.8125rem', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="required">Required</option>
                  <option value="preferred">Preferred</option>
                </select>
                <input
                  type="text"
                  value={newReqLabel}
                  onChange={e => setNewReqLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addRequirement(); }}
                  placeholder="e.g. Next.js, 3+ years experience..."
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 7, fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-base)' }}
                />
                <Button variant="primary" size="sm" onClick={addRequirement}>
                  <Plus size={13} /> Add
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <SectionHeader title="Review" description="HireFlow has interpreted your job description. Review before creating the role." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{form.title || 'Untitled Role'}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  {form.department} · {form.location} · {form.experienceLevel} · {form.employmentType.replace('_', ' ')}
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {form.description.slice(0, 300) || 'No description provided.'}
                  {form.description.length > 300 ? '...' : ''}
                </p>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>Core Requirements</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {requirements.filter(r => r.type === 'required').map(req => (
                    <Badge key={req.id} color="var(--accent)" bg="var(--accent-light)">{req.label}</Badge>
                  ))}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 10 }}>Preferred Requirements</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {requirements.filter(r => r.type === 'preferred').map(req => (
                    <Badge key={req.id}>{req.label}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <Button
            variant="ghost"
            size="md"
            onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/jobs')}
          >
            <ArrowLeft size={14} /> {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 3 ? (
            <Button variant="primary" size="md" onClick={() => setStep(s => s + 1)}>
              Continue <ChevronRight size={14} />
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating role...' : 'Create Role'}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

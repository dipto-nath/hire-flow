'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Badge, Avatar, CoverageBar } from '@/components/ui';
import { mockCandidates } from '@/mock-data/candidates';
import { groupLabel, groupColor } from '@/lib/utils';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SearchResult } from '@/types';

const suggestedSearches = [
  'Candidates with 3+ years React experience',
  'Who has fintech experience?',
  'Candidates missing evidence for Next.js',
  'Show candidates interviewed this week',
  'Strong match candidates with TypeScript',
  'Candidates with design system experience',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setIsSearching(true);
    await new Promise(r => setTimeout(r, 700));

    const lower = q.toLowerCase();
    const searchResults: SearchResult[] = [];

    mockCandidates.forEach(candidate => {
      const matchReasons: SearchResult['matchReasons'] = [];
      let score = 0;

      // Skill matching
      candidate.skills.forEach(skill => {
        if (lower.includes(skill.toLowerCase())) {
          matchReasons.push({ label: skill, source: 'Resume', detail: `Listed as primary skill` });
          score += 25;
        }
      });

      // Experience matching
      const yearMatch = lower.match(/(\d+)\+?\s*years?/);
      if (yearMatch) {
        const required = parseInt(yearMatch[1]);
        if (candidate.yearsExperience >= required) {
          matchReasons.push({ label: `${candidate.yearsExperience} years experience`, source: 'Resume', detail: `Meets ${required}+ year requirement` });
          score += 20;
        }
      }

      // Fintech/domain
      if (lower.includes('fintech') || lower.includes('finance')) {
        const domainMatch = ['Zenpay', 'N26', 'Razorpay', 'Flutterwave', 'Klarna'].some(company =>
          candidate.currentCompany.includes(company) || candidate.name.toLowerCase().includes(company.toLowerCase())
        );
        if (domainMatch) {
          matchReasons.push({ label: 'Fintech experience', source: 'Resume', detail: `Works at ${candidate.currentCompany}` });
          score += 30;
        }
      }

      // Missing requirement
      if (lower.includes('missing') || lower.includes('needs validation')) {
        if (candidate.validationNeeded) {
          matchReasons.push({ label: 'Needs validation', source: 'HireFlow Analysis', detail: 'Has unresolved requirements' });
          score += 15;
        }
      }

      // Interview
      if (lower.includes('interview')) {
        if (candidate.interviewStatus === 'completed' || candidate.interviewStatus === 'scheduled') {
          matchReasons.push({ label: `Interview ${candidate.interviewStatus}`, source: 'Interview records', detail: `Interview status: ${candidate.interviewStatus}` });
          score += 20;
        }
      }

      // Strong match bonus
      if (candidate.group === 'strong_match') score += 10;

      if (matchReasons.length > 0) {
        searchResults.push({ candidate, matchReasons, relevanceScore: Math.min(score, 100) });
      }
    });

    if (searchResults.length === 0) {
      mockCandidates.slice(0, 5).forEach(c => {
        searchResults.push({
          candidate: c,
          matchReasons: [{ label: c.skills[0] ?? 'General match', source: 'Resume', detail: 'Active candidate pool' }],
          relevanceScore: 30,
        });
      });
    }

    setResults(searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore));
    setIsSearching(false);
  };

  return (
    <AppShell title="Candidate Search" breadcrumbs={[{ label: 'Candidate Search' }]}>
      <div style={{ padding: '32px 28px 64px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Search your candidate pool
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Use natural language to find candidates based on skills, experience, domain, or interview status.
          </p>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(query); }}
            placeholder="Find candidates with React experience who have worked on high-scale products..."
            aria-label="Natural language candidate search"
            style={{
              width: '100%',
              paddingLeft: 48,
              paddingRight: 120,
              paddingTop: 14,
              paddingBottom: 14,
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              fontSize: '0.9375rem',
              color: 'var(--text-primary)',
              background: 'var(--bg-surface)',
              outline: 'none',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box',
            }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSearch(query)}
            disabled={isSearching}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Suggested searches */}
        {!results && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Suggested searches
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {suggestedSearches.map(s => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isSearching && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-pulse-soft" style={{ fontSize: '0.875rem' }}>
              Searching candidate pool...
            </div>
          </div>
        )}

        {/* Results */}
        {results && !isSearching && (
          <div>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {results.length} results
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                for &ldquo;{query}&rdquo;
              </span>
              <button
                onClick={() => { setResults(null); setQuery(''); }}
                style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--accent)', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(result => (
                <div key={result.candidate.id} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: 18,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                    <Avatar initials={result.candidate.initials} color={result.candidate.avatarColor} size={40} name={result.candidate.name} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          {result.candidate.name}
                        </span>
                        <Badge color={groupColor[result.candidate.group].color} bg={groupColor[result.candidate.group].bg}>
                          {groupLabel[result.candidate.group]}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {result.candidate.currentRole} · {result.candidate.currentCompany} · {result.candidate.yearsExperience}y exp
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <CoverageBar value={result.candidate.requirementCoverage} size="sm" />
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Matched because
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.matchReasons.map((reason, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', minWidth: 140 }}>
                            {reason.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reason.source}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>·</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{reason.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link href={`/candidates/${result.candidate.id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="sm">
                      View Profile <ArrowRight size={13} />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

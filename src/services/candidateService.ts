import { Candidate, CandidateGroup, CandidateStage } from '@/types';
import { mockCandidates } from '@/mock-data/candidates';

const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

export const candidateService = {
  async getCandidates(): Promise<Candidate[]> {
    await delay();
    return mockCandidates;
  },

  async getCandidatesForJob(jobId: string): Promise<Candidate[]> {
    await delay();
    return mockCandidates.filter(c => c.jobId === jobId);
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    await delay();
    return mockCandidates.find(c => c.id === id) ?? null;
  },

  async moveCandidateStage(candidateId: string, stage: CandidateStage): Promise<Candidate> {
    await delay(300);
    const candidate = mockCandidates.find(c => c.id === candidateId);
    if (!candidate) throw new Error('Candidate not found');
    return { ...candidate, stage, updatedAt: new Date().toISOString() };
  },

  async overrideCandidateGroup(candidateId: string, group: CandidateGroup): Promise<Candidate> {
    await delay(300);
    const candidate = mockCandidates.find(c => c.id === candidateId);
    if (!candidate) throw new Error('Candidate not found');
    return { ...candidate, group, groupOverridden: true, updatedAt: new Date().toISOString() };
  },

  async getCandidatesByGroup(jobId: string): Promise<Record<CandidateGroup, Candidate[]>> {
    await delay();
    const candidates = mockCandidates.filter(c => c.jobId === jobId);
    return {
      strong_match: candidates.filter(c => c.group === 'strong_match'),
      potential_match: candidates.filter(c => c.group === 'potential_match'),
      needs_validation: candidates.filter(c => c.group === 'needs_validation'),
      insufficient_evidence: candidates.filter(c => c.group === 'insufficient_evidence'),
    };
  },

  async getStageDistribution(jobId: string): Promise<Record<CandidateStage, number>> {
    await delay();
    const candidates = mockCandidates.filter(c => c.jobId === jobId);
    const dist: Record<CandidateStage, number> = {
      applied: 0, screening: 0, interview: 0, evaluation: 0, decision: 0,
    };
    candidates.forEach(c => dist[c.stage]++);
    return dist;
  },
};

import { Candidate, CandidateSummary, InterviewQuestion, Evaluation, SearchResult, RequirementMatch } from '@/types';
import { mockCandidates } from '@/mock-data/candidates';
import { mockJobs } from '@/mock-data/jobs';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export const aiService = {
  /**
   * Map a candidate's evidence against job requirements.
   * Returns structured requirement matches.
   */
  async mapCandidateToRequirements(candidateId: string, jobId: string): Promise<RequirementMatch[]> {
    await delay();
    const candidate = mockCandidates.find(c => c.id === candidateId);
    const job = mockJobs.find(j => j.id === jobId);
    if (!candidate || !job) return [];

    return job.requirements.map(req => {
      const evidence = candidate.evidence.find(e => e.requirementId === req.id) ?? null;
      return {
        requirement: req,
        evidence,
        status: evidence?.status ?? 'not_found',
        validationQuestion: evidence?.status === 'needs_validation'
          ? `Can you provide specific examples of your ${req.label} experience, including the project context, tools used, and outcomes?`
          : undefined,
      };
    });
  },

  /**
   * Generate a candidate summary from available profile data.
   */
  async generateCandidateSummary(candidateId: string): Promise<CandidateSummary> {
    await delay(800);
    const candidate = mockCandidates.find(c => c.id === candidateId);
    if (candidate?.summary) return candidate.summary;

    return {
      overview: `${candidate?.name ?? 'Candidate'} is a ${candidate?.currentRole ?? 'professional'} with ${candidate?.yearsExperience ?? 0} years of experience. Full summary available after resume analysis.`,
      experience: `${candidate?.yearsExperience ?? 0} years of professional experience.`,
      skills: candidate?.skills.join(', ') ?? 'Skills to be extracted from resume.',
      projects: 'Project details to be extracted from resume.',
      education: candidate?.education ?? 'Education details not available.',
      domainExperience: 'Domain experience to be extracted from resume.',
      potentialGaps: 'Gap analysis pending full resume review.',
    };
  },

  /**
   * Generate interview questions for a candidate and job.
   */
  async generateInterviewQuestions(candidateId: string, jobId: string): Promise<InterviewQuestion[]> {
    await delay(1200);
    const candidate = mockCandidates.find(c => c.id === candidateId);
    const job = mockJobs.find(j => j.id === jobId);
    if (!candidate || !job) return [];

    // Return questions based on requirement gaps and evidence
    const needsValidation = candidate.evidence.filter(e =>
      e.status === 'needs_validation' || e.status === 'partial'
    );

    return needsValidation.map((ev, i) => ({
      id: `gen-q-${i}`,
      text: `Can you describe your experience with ${ev.requirementId.replace('req-fe-', '').replace('req-ml-', '')} in a production context? Walk me through a specific project.`,
      category: 'validation' as const,
      requirementId: ev.requirementId,
      requirementLabel: ev.requirementId,
      whyAsk: `Evidence for this requirement is ${ev.status === 'needs_validation' ? 'unclear' : 'partial'} based on available profile information.`,
      evidenceContext: ev.excerpt,
      expectedEvidence: 'Specific project, metrics, tools, and outcomes.',
    }));
  },

  /**
   * Generate an evaluation report structure for a candidate.
   */
  async generateEvaluationReport(candidateId: string, jobId: string): Promise<Partial<Evaluation>> {
    await delay(1000);
    const candidate = mockCandidates.find(c => c.id === candidateId);
    const job = mockJobs.find(j => j.id === jobId);
    if (!candidate || !job) return {};

    return {
      id: `eval-${candidateId}`,
      candidateId,
      jobId,
      createdAt: new Date().toISOString(),
      interviewers: ['Alex Rivera'],
      requirementRows: job.requirements.map(req => {
        const evidence = candidate.evidence.find(e => e.requirementId === req.id);
        return {
          requirementId: req.id,
          requirementLabel: req.label,
          evidence: evidence?.excerpt ?? 'No evidence found.',
          confidence: evidence?.status === 'verified' ? 'high' :
            evidence?.status === 'strong' ? 'high' :
            evidence?.status === 'partial' ? 'medium' :
            evidence?.status === 'needs_validation' ? 'low' : 'none',
          status: evidence?.status ?? 'not_found',
          source: evidence?.sourceLabel ?? 'Not found',
        };
      }),
      interviewEvidence: 'Interview evidence to be populated from interview notes.',
      outstandingValidation: candidate.evidence
        .filter(e => e.status === 'needs_validation')
        .map(e => `${e.requirementId}: ${e.excerpt}`),
    };
  },

  /**
   * Search candidates with natural language query.
   */
  async searchCandidates(query: string): Promise<SearchResult[]> {
    await delay(600);
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    mockCandidates.forEach(candidate => {
      const matchReasons: SearchResult['matchReasons'] = [];
      let score = 0;

      // Skill matching
      candidate.skills.forEach(skill => {
        if (q.includes(skill.toLowerCase())) {
          matchReasons.push({ label: skill, source: 'Resume', detail: `Listed as a primary skill` });
          score += 20;
        }
      });

      // Experience matching
      if (q.includes('experience') || q.includes('years')) {
        const yearMatch = q.match(/(\d+)\+?\s*years?/);
        if (yearMatch) {
          const requiredYears = parseInt(yearMatch[1]);
          if (candidate.yearsExperience >= requiredYears) {
            matchReasons.push({
              label: `${candidate.yearsExperience} years experience`,
              source: 'Resume',
              detail: `Meets the ${requiredYears}+ year requirement`,
            });
            score += 15;
          }
        }
      }

      // Role/domain matching
      if (q.includes('leadership') || q.includes('lead') || q.includes('senior')) {
        const leadershipEvidence = candidate.evidence.find(e =>
          e.requirementId === 'req-fe-8' && (e.status === 'verified' || e.status === 'strong' || e.status === 'partial')
        );
        if (leadershipEvidence) {
          matchReasons.push({ label: 'Leadership experience', source: 'Resume / Interview', detail: leadershipEvidence.excerpt.slice(0, 80) + '...' });
          score += 25;
        }
      }

      // Strong match bonus
      if (candidate.group === 'strong_match') score += 10;

      if (matchReasons.length > 0 || score > 0) {
        results.push({ candidate, matchReasons, relevanceScore: Math.min(score, 100) });
      }
    });

    // If no specific matches, return some candidates
    if (results.length === 0) {
      return mockCandidates.slice(0, 5).map(candidate => ({
        candidate,
        matchReasons: [{ label: candidate.skills[0] ?? 'General match', source: 'Resume', detail: 'Candidate in active pool' }],
        relevanceScore: 30,
      }));
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
  },
};

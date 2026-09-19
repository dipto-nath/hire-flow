import { Interview, InterviewNote, FollowUpSuggestion } from '@/types';
import { mockInterviews } from '@/mock-data/interviews';

const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

export const interviewService = {
  async getInterviewsForCandidate(candidateId: string): Promise<Interview[]> {
    await delay();
    return mockInterviews.filter(i => i.candidateId === candidateId);
  },

  async getInterviewById(id: string): Promise<Interview | null> {
    await delay();
    return mockInterviews.find(i => i.id === id) ?? null;
  },

  async getAllInterviews(): Promise<Interview[]> {
    await delay();
    return mockInterviews;
  },

  async saveNote(interviewId: string, note: Omit<InterviewNote, 'id'>): Promise<InterviewNote> {
    await delay(200);
    return {
      ...note,
      id: `note-${Date.now()}`,
    };
  },

  async generateFollowUp(noteContent: string, requirementLabel: string): Promise<FollowUpSuggestion> {
    await delay(800);
    return {
      id: `followup-${Date.now()}`,
      question: `Can you elaborate on that — specifically what challenges you encountered with ${requirementLabel} and how you measured success?`,
      why: `The candidate described experience but did not provide specific metrics or a clear methodology. This follow-up will establish whether the claim is supported by concrete evidence.`,
      whatToValidate: `Look for: specific numbers, tools used, approach taken, and outcome. Generic answers should prompt deeper questioning.`,
      basedOnNote: noteContent,
      requirementLabel,
    };
  },
};

import { Job } from '@/types';
import { mockJobs } from '@/mock-data/jobs';

// Simulate async API call
const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

export const jobService = {
  async getJobs(): Promise<Job[]> {
    await delay();
    return mockJobs;
  },

  async getJobById(id: string): Promise<Job | null> {
    await delay();
    return mockJobs.find(j => j.id === id) ?? null;
  },

  async getJobsByStatus(status: Job['status']): Promise<Job[]> {
    await delay();
    return mockJobs.filter(j => j.status === status);
  },

  async createJob(data: Partial<Job>): Promise<Job> {
    await delay(500);
    const newJob: Job = {
      id: `job-${Date.now()}`,
      title: data.title ?? 'Untitled Role',
      department: data.department ?? '',
      location: data.location ?? '',
      employmentType: data.employmentType ?? 'full_time',
      experienceLevel: data.experienceLevel ?? 'mid',
      status: 'draft',
      description: data.description ?? '',
      requirements: data.requirements ?? [],
      candidateCount: 0,
      interviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hiringStage: 'Draft',
    };
    return newJob;
  },
};

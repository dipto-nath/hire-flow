import { Notification } from '@/types';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'success',
    title: '8 resumes finished processing',
    description: 'Senior Frontend Engineer — all candidates ready for review.',
    timestamp: '2026-09-19T08:45:00Z',
    read: false,
    link: '/jobs/job-fe-001/candidates',
  },
  {
    id: 'notif-002',
    type: 'warning',
    title: '3 candidates need validation',
    description: 'Lena Bauer, Kwame Asante, and Daniel Park have unresolved requirements.',
    timestamp: '2026-09-19T08:30:00Z',
    read: false,
    link: '/jobs/job-fe-001/candidates',
  },
  {
    id: 'notif-003',
    type: 'info',
    title: 'Interview evaluation incomplete',
    description: 'Marcos Oliveira — evaluation report not yet submitted.',
    timestamp: '2026-09-18T15:00:00Z',
    read: false,
    link: '/candidates/cand-002/report',
  },
  {
    id: 'notif-004',
    type: 'success',
    title: 'New interview summary available',
    description: 'Aarav Mehta interview summary generated.',
    timestamp: '2026-09-15T11:45:00Z',
    read: true,
    link: '/candidates/cand-001/interview',
  },
  {
    id: 'notif-005',
    type: 'info',
    title: 'Interview scheduled',
    description: 'Lena Bauer — interview scheduled for Sep 20, 11:00 AM.',
    timestamp: '2026-09-14T09:00:00Z',
    read: true,
    link: '/interviews',
  },
];

export { mockJobs } from './jobs';
export { mockCandidates, getCandidatesForJob, getCandidateById } from './candidates';
export { mockInterviews, getInterviewsForCandidate, getInterviewById } from './interviews';
export { mockAuditEvents, getAuditEventsForCandidate, getAuditEventsForJob } from './audit';

import { AuditEvent } from '@/types';
import { mockAuditEvents } from '@/mock-data/audit';

const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

export const auditService = {
  async getAuditTrail(filters?: { candidateId?: string; jobId?: string; source?: string }): Promise<AuditEvent[]> {
    await delay();
    let events = [...mockAuditEvents].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (filters?.candidateId) events = events.filter(e => e.candidateId === filters.candidateId);
    if (filters?.jobId) events = events.filter(e => e.jobId === filters.jobId);
    if (filters?.source) events = events.filter(e => e.source === filters.source);
    return events;
  },

  async getEventById(id: string): Promise<AuditEvent | null> {
    await delay();
    return mockAuditEvents.find(e => e.id === id) ?? null;
  },
};

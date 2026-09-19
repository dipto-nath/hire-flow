export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  jobs: {
    list: (params?: { status?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/jobs${query ? `?${query}` : ''}`);
    },
    get: (id: string) => fetchAPI(`/api/jobs/${id}`),
    create: (data: any) => fetchAPI('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/jobs/${id}`, { method: 'DELETE' }),
    getRequirements: (id: string) => fetchAPI(`/api/jobs/${id}/requirements`),
    addRequirement: (id: string, data: any) => fetchAPI(`/api/jobs/${id}/requirements`, { method: 'POST', body: JSON.stringify(data) }),
  },
  candidates: {
    list: (params?: { jobId?: string; stage?: string; group?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/candidates${query ? `?${query}` : ''}`);
    },
    get: (id: string) => fetchAPI(`/api/candidates/${id}`),
    create: (data: any) => fetchAPI('/api/candidates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStage: (id: string, stage: string) => fetchAPI(`/api/candidates/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
    updateGroup: (id: string, group: string) => fetchAPI(`/api/candidates/${id}/group`, { method: 'PATCH', body: JSON.stringify({ group }) }),
    delete: (id: string) => fetchAPI(`/api/candidates/${id}`, { method: 'DELETE' }),
  },
  interviews: {
    list: (params?: { jobId?: string; candidateId?: string; status?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/interviews${query ? `?${query}` : ''}`);
    },
    get: (id: string) => fetchAPI(`/api/interviews/${id}`),
    getByCandidate: (candidateId: string) => fetchAPI(`/api/interviews/candidate/${candidateId}`),
    create: (data: any) => fetchAPI('/api/interviews', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/interviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    addNote: (id: string, data: any) => fetchAPI(`/api/interviews/${id}/notes`, { method: 'POST', body: JSON.stringify(data) }),
    getNotes: (id: string) => fetchAPI(`/api/interviews/${id}/notes`),
  },
  audit: {
    list: (params?: { candidateId?: string; jobId?: string; source?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/audit${query ? `?${query}` : ''}`);
    }
  },
  search: {
    query: (data: { query: string; jobId?: string; limit?: number }) => fetchAPI('/api/search', { method: 'POST', body: JSON.stringify(data) }),
  },
    upload: {
    document: async (file: File, candidateId: string, type: string) => {
      const formData = new FormData();
      formData.append('candidateId', candidateId);
      formData.append('type', type);
      formData.append('file', file);
      
      const res = await fetch(`${API_BASE}/api/upload/document`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Upload failed: ${res.status}`);
      }
      return res.json();
    }
  }
};

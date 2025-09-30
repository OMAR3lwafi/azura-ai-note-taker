// API client for backend endpoints
import { supabase } from './supabase';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Generic fetch wrapper with auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Meetings API
export const meetingsApi = {
  create: (meeting: { title?: string; language?: 'ar' | 'en'; tags?: string[]; project?: string; is_offline?: boolean }) =>
    apiFetch('/v1/meetings', {
      method: 'POST',
      body: JSON.stringify(meeting),
    }),

  list: (filters?: { limit?: number; offset?: number; tags?: string; project?: string; language?: string }) => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));
    if (filters?.tags) params.set('tags', filters.tags);
    if (filters?.project) params.set('project', filters.project);
    if (filters?.language) params.set('language', filters.language);
    
    return apiFetch(`/v1/meetings?${params.toString()}`, { method: 'GET' });
  },

  end: (id: string) =>
    apiFetch(`/v1/meetings/${id}/end`, { method: 'PATCH' }),

  getSpeakers: (id: string) =>
    apiFetch(`/v1/meetings/${id}/speakers`, { method: 'GET' }),

  updateSpeaker: (id: string, label: string, displayName: string) =>
    apiFetch(`/v1/meetings/${id}/speakers/${label}`, {
      method: 'PUT',
      body: JSON.stringify({ display_name: displayName }),
    }),

  getTopics: (id: string) =>
    apiFetch(`/v1/meetings/${id}/topics`, { method: 'GET' }),

  ingestOffline: (id: string, audioUrl: string, format: string = 'mp3') =>
    apiFetch(`/v1/meetings/${id}/ingest`, {
      method: 'POST',
      body: JSON.stringify({ audioUrl, format }),
    }),
};

// Search API
export const searchApi = {
  fullText: (query: string, options?: { meetingId?: string; lang?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams({ q: query });
    if (options?.meetingId) params.set('meetingId', options.meetingId);
    if (options?.lang) params.set('lang', options.lang);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));

    return apiFetch(`/v1/search?${params.toString()}`, { method: 'GET' });
  },

  semantic: (query: string, options?: { meetingId?: string; limit?: number }) => {
    const params = new URLSearchParams({ q: query });
    if (options?.meetingId) params.set('meetingId', options.meetingId);
    if (options?.limit) params.set('limit', String(options.limit));

    return apiFetch(`/v1/search/semantic?${params.toString()}`, { method: 'GET' });
  },
};

// AI API
export const aiApi = {
  summarize: (meetingId: string, windowSec: number = 180) =>
    apiFetch('/v1/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ meetingId, windowSec }),
    }),
};

// Export API
export const exportApi = {
  generate: (meetingId: string, format: 'markdown' | 'txt' | 'html') =>
    apiFetch('/v1/export', {
      method: 'POST',
      body: JSON.stringify({ meetingId, format }),
    }),

  getSignedUrl: (assetId: string) =>
    apiFetch(`/v1/assets/${assetId}/signed-url`, { method: 'GET' }),
};

// Integration API
export const integrationApi = {
  push: (provider: 'notion' | 'trello' | 'todo', data: { meetingId: string; summary: string; tasks: any[] }) =>
    apiFetch(`/v1/integrations/${provider}/push`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveConfig: (provider: string, config: any) =>
    apiFetch(`/v1/integrations/${provider}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
};

// Auth API (Advanced)
export const authApi = {
  generateApiKey: (name: string, scopes: string[] = ['read']) =>
    apiFetch('/v1/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, scopes }),
    }),
};

// Segments API
export const segmentsApi = {
  batch: (meetingId: string, segments: any[]) =>
    apiFetch('/v1/segments/batch', {
      method: 'POST',
      body: JSON.stringify({ meetingId, segments }),
    }),
};

// STT Token API
export const sttApi = {
  getToken: () =>
    apiFetch('/v1/token/stt', { method: 'POST' }),
};

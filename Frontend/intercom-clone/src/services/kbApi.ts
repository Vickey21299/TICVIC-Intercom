import type {
  ArticleCreatePayload,
  ArticleDetailResponse,
  ArticleListResponse,
  ArticleUpdatePayload,
} from '../types/knowledge_base';

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api/knowledge-base';

export const kbApi = {
  list: async (): Promise<ArticleListResponse> => {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Failed to fetch articles');
    return res.json();
  },

  get: async (id: string): Promise<ArticleDetailResponse> => {
    const res = await fetch(`${BASE}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch article');
    return res.json();
  },

  getBySlug: async (slug: string): Promise<ArticleDetailResponse> => {
    const res = await fetch(`${BASE}/slug/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch article by slug');
    return res.json();
  },

  create: async (payload: ArticleCreatePayload): Promise<ArticleDetailResponse> => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create article');
    return res.json();
  },

  update: async (id: string, payload: ArticleUpdatePayload): Promise<ArticleDetailResponse> => {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update article');
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete article');
  },
};

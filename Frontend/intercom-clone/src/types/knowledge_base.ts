export interface Article {
  article_id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  status: 'Draft' | 'Published';
  created_at: string;
  updated_at: string;
}

export interface ArticleListResponse {
  success: boolean;
  message: string;
  articles: Article[];
  total: number;
}

export interface ArticleDetailResponse {
  success: boolean;
  message: string;
  article: Article;
}

export interface ArticleCreatePayload {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  status: string;
}

export interface ArticleUpdatePayload {
  title?: string;
  excerpt?: string;
  body?: string;
  category?: string;
  status?: string;
}

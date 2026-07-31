import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { kbApi } from '../../services/kbApi';
import type { Article } from '../../types/knowledge_base';
import styles from './KnowledgeBaseReader.module.css';

export function KnowledgeBaseReaderPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return;
      setLoading(true);
      setError(false);
      try {
        const res = await kbApi.getBySlug(slug);
        if (res.success && res.article) {
          setArticle(res.article);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load KB article', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className={styles.notFound}>
        <h1>Article Not Found</h1>
        <p>The knowledge base article you are looking for does not exist or has been moved.</p>
        <Link to="/" className={styles.backLink} style={{ marginTop: '1.5rem' }}>
          &larr; Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>
        &larr; Back to Support
      </Link>

      <article>
        <header className={styles.header}>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            <span className={styles.categoryTag}>{article.category}</span>
            <span>Published {new Date(article.created_at).toLocaleDateString()}</span>
            <span>&bull;</span>
            <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
          </div>
        </header>

        {/* Display rich html content from body */}
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </article>
    </div>
  );
}

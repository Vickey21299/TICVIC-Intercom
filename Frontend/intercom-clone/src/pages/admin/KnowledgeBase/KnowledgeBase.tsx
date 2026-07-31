import { useEffect, useRef, useState } from 'react';
import { kbApi } from '../../../services/kbApi';
import type { Article, ArticleCreatePayload } from '../../../types/knowledge_base';
import styles from './KnowledgeBase.module.css';

/* ────────────────────────────────────────────────────────────────────────
   Constants
──────────────────────────────────────────────────────────────────────── */
const ALL_CATEGORIES = 'All Articles';
const DEFAULT_CATEGORY = 'Support';

/* ────────────────────────────────────────────────────────────────────────
   Rich Text Toolbar helpers (execCommand — works without a library)
──────────────────────────────────────────────────────────────────────── */
interface ToolbarAction { label: string; command?: string; value?: string; action?: () => void; sep?: boolean }

function RichToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const exec = (cmd: string, value = '') => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value || undefined);
  };

  const tools: ToolbarAction[] = [
    { label: 'B',  command: 'bold' },
    { label: 'I',  command: 'italic' },
    { label: 'U',  command: 'underline' },
    { sep: true,   label: '' },
    { label: 'H1', command: 'formatBlock', value: 'H1' },
    { label: 'H2', command: 'formatBlock', value: 'H2' },
    { label: 'P',  command: 'formatBlock', value: 'P' },
    { sep: true,   label: '' },
    { label: '• List',  command: 'insertUnorderedList' },
    { label: '1. List', command: 'insertOrderedList' },
    { sep: true,   label: '' },
    { label: '⎯',  command: 'insertHorizontalRule' },
    { label: 'Clear', action: () => { if (editorRef.current) editorRef.current.innerHTML = ''; } },
  ];

  return (
    <div className={styles.richToolbar}>
      {tools.map((t, i) =>
        t.sep ? (
          <div key={i} className={styles.toolbarSep} />
        ) : (
          <button
            key={i}
            type="button"
            className={styles.toolbarBtn}
            title={t.label}
            onMouseDown={e => {
              e.preventDefault();
              if (t.action) { t.action(); return; }
              if (t.command) exec(t.command, t.value || '');
            }}
          >
            {t.label}
          </button>
        )
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Article Editor Modal
──────────────────────────────────────────────────────────────────────── */
interface EditorProps {
  article?: Article | null;
  onClose: () => void;
  onSaved: () => void;
}

function ArticleEditor({ article, onClose, onSaved }: EditorProps) {
  const isEdit = !!article;
  const [title,    setTitle]    = useState(article?.title    ?? '');
  const [excerpt,  setExcerpt]  = useState(article?.excerpt  ?? '');
  const [category, setCategory] = useState(article?.category ?? DEFAULT_CATEGORY);
  const [saving,   setSaving]   = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Seed the body into contentEditable on first render
  useEffect(() => {
    if (editorRef.current && article?.body) {
      editorRef.current.innerHTML = article.body;
    }
  }, []);

  const handleSave = async (targetStatus: 'Draft' | 'Published') => {
    if (!title.trim()) { alert('Title is required.'); return; }
    setSaving(true);
    const body = editorRef.current?.innerHTML ?? '';

    const payload: ArticleCreatePayload = { title, excerpt, body, category, status: targetStatus };

    try {
      if (isEdit && article) {
        await kbApi.update(article.article_id, payload);
      } else {
        await kbApi.create(payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>{isEdit ? 'Edit Article' : 'New Article'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Title */}
          <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. How to reset your password"
            />
          </div>

          {/* Excerpt + Category */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Short Excerpt</label>
              <input
                className={styles.input}
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="One-line summary"
              />
            </div>
            <div className={styles.field} style={{ maxWidth: 180 }}>
              <label className={styles.label}>Category</label>
              <select
                className={styles.select}
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {['Support', 'Billing', 'Account', 'Technical', 'General'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rich Body Editor */}
          <div className={styles.field}>
            <label className={styles.label}>Body</label>
            <RichToolbar editorRef={editorRef} />
            <div
              ref={editorRef}
              className={styles.richEditor}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Start writing your article..."
              onInput={() => {}}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={styles.btnDraft} onClick={() => handleSave('Draft')} disabled={saving}>
            Save as Draft
          </button>
          <button className={styles.btnPublish} onClick={() => handleSave('Published')} disabled={saving}>
            {saving ? 'Saving…' : (isEdit ? 'Update & Publish' : 'Publish')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Confirm Delete Dialog
──────────────────────────────────────────────────────────────────────── */
function ConfirmDelete({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className={styles.confirmOverlay}>
      <div className={styles.confirmBox}>
        <h3>Delete Article?</h3>
        <p>
          Are you sure you want to delete <strong>"{title}"</strong>? This action cannot be undone.
        </p>
        <div className={styles.confirmActions}>
          <button className={styles.btnSecondary} onClick={onCancel}>Cancel</button>
          <button className={styles.btnDanger} onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Main Knowledge Base Page
──────────────────────────────────────────────────────────────────────── */
export function KnowledgeBasePage() {
  const [articles,       setArticles]       = useState<Article[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [editorOpen,     setEditorOpen]     = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingId,     setDeletingId]     = useState<string | null>(null);

  /* ── Load ─────────────────────────────────────────────────────────── */
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await kbApi.list();
      setArticles(res.articles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Derived state ────────────────────────────────────────────────── */
  const categories = [ALL_CATEGORIES, ...Array.from(new Set(articles.map(a => a.category)))];

  const categoryCounts: Record<string, number> = {};
  articles.forEach(a => {
    categoryCounts[a.category] = (categoryCounts[a.category] ?? 0) + 1;
  });

  const publishedCount = articles.filter(a => a.status === 'Published').length;
  const draftCount     = articles.filter(a => a.status === 'Draft').length;

  const filtered = articles.filter(a => {
    const matchCat    = activeCategory === ALL_CATEGORIES || a.category === activeCategory;
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  /* ── Actions ──────────────────────────────────────────────────────── */
  const openNew  = () => { setEditingArticle(null); setEditorOpen(true); };
  const openEdit = (a: Article) => { setEditingArticle(a); setEditorOpen(true); };
  const closeEditor = () => setEditorOpen(false);

  const handleSaved = () => {
    closeEditor();
    load(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await kbApi.delete(deletingId);
      setDeletingId(null);
      load(true);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePublish = async (a: Article) => {
    const newStatus = a.status === 'Published' ? 'Draft' : 'Published';
    try {
      await kbApi.update(a.article_id, { status: newStatus });
      setArticles(prev => prev.map(x => x.article_id === a.article_id ? { ...x, status: newStatus } : x));
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* ── Category Sidebar ── */}
      <aside className={styles.categorySidebar}>
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarTitle}>Categories</p>
        </div>
        <div className={styles.categoryList}>
          {categories.map(cat => {
            const isActive = cat === activeCategory;
            const count    = cat === ALL_CATEGORIES ? articles.length : (categoryCounts[cat] ?? 0);
            return (
              <button
                key={cat}
                className={`${styles.categoryItem} ${isActive ? styles.categoryItemActive : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat}</span>
                <span className={`${styles.categoryCount} ${isActive ? styles.categoryCountActive : ''}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <h1>Knowledge Base</h1>
            <p>Create, manage, and publish help articles for your customers</p>
          </div>
          <input
            className={styles.searchBox}
            placeholder="🔍  Search articles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.newBtn} onClick={openNew}>
            <span>＋</span> New Article
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Stats row */}
          <div className={styles.statsRow}>
            {[
              { icon: '📚', label: 'Total Articles', value: articles.length, color: '#eff6ff', iconBg: '#dbeafe' },
              { icon: '✅', label: 'Published', value: publishedCount, color: '#f0fdf4', iconBg: '#bbf7d0' },
              { icon: '📝', label: 'Drafts', value: draftCount, color: '#fefce8', iconBg: '#fef08a' },
              { icon: '🗂️', label: 'Categories', value: categories.length - 1, color: '#f5f3ff', iconBg: '#e9d5ff' },
            ].map(s => (
              <div key={s.label} className={styles.stat} style={{ background: s.color }}>
                <div className={styles.statIcon} style={{ background: s.iconBg }}>
                  {s.icon}
                </div>
                <div>
                  <div className={styles.statLabel}>{s.label}</div>
                  <div className={styles.statValue}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Articles */}
          {loading ? (
            <div className={styles.loader}>
              <div className={styles.spinner} />
              <span>Loading articles…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📄</div>
              <h3>{search ? 'No articles match your search' : 'No articles here yet'}</h3>
              <p>{search ? 'Try a different keyword.' : 'Click "New Article" to create your first help article.'}</p>
              {!search && (
                <button className={styles.newBtn} onClick={openNew}>＋ New Article</button>
              )}
            </div>
          ) : (
            <>
              <p className={styles.sectionTitle}>
                {activeCategory} — {filtered.length} article{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className={styles.grid}>
                {filtered.map(article => (
                  <div key={article.article_id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardTitle}>{article.title}</span>
                      <span className={`${styles.statusBadge} ${article.status === 'Published' ? styles.statusPublished : styles.statusDraft}`}>
                        {article.status}
                      </span>
                    </div>

                    {article.excerpt && (
                      <p className={styles.cardExcerpt}>{article.excerpt}</p>
                    )}

                    <div className={styles.cardMeta}>
                      <span className={styles.categoryTag}>
                        🗂️ {article.category}
                      </span>
                      <span>{new Date(article.updated_at).toLocaleDateString()}</span>
                    </div>

                    <div className={styles.cardActions}>
                      <button className={styles.iconBtn} onClick={() => openEdit(article)}>
                        ✏️ Edit
                      </button>
                      <button className={styles.iconBtn} onClick={() => togglePublish(article)}>
                        {article.status === 'Published' ? '📥 Unpublish' : '🚀 Publish'}
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => setDeletingId(article.article_id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Editor Modal ── */}
      {editorOpen && (
        <ArticleEditor
          article={editingArticle}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deletingId && (
        <ConfirmDelete
          title={articles.find(a => a.article_id === deletingId)?.title ?? ''}
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}

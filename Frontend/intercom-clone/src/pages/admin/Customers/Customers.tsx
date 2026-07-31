import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import type { Conversation, Customer } from '../../../types/api';
import { authSession } from '../../../utils/authSession';
import styles from './Customers.module.css';

/* ── Status badge helper ─────────────────────────────────────────────── */
function statusClass(status: string) {
  switch (status) {
    case 'Open':    return styles.statusOpen;
    case 'Closed':  return styles.statusClosed;
    case 'Pending': return styles.statusPending;
    case 'Snoozed': return styles.statusSnoozed;
    default:        return '';
  }
}

/* ── Conversations Slide-in Drawer ───────────────────────────────────── */
interface DrawerProps {
  customer: Customer;
  onClose: () => void;
}

function ConversationsDrawer({ customer, onClose }: DrawerProps) {
  const [convs,   setConvs]   = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authSession.getUser();
  const userId = user?.id || 'admin_acme';

  useEffect(() => {
    api.getCustomerConversations(customer.customer_id, userId)
      .then(res => setConvs(res.conversations))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customer.customer_id, userId]);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div>
            <h3>{customer.name}'s Conversations</h3>
            <p>{customer.email}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={styles.drawerBody}>
          {loading ? (
            <div className={styles.loader}>
              <div className={styles.spinner} />
              <span>Loading…</span>
            </div>
          ) : convs.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <h3>No conversations</h3>
              <p>This customer has no conversations yet.</p>
            </div>
          ) : (
            convs.map(c => (
              <div key={c.conversation_id} className={styles.convCard}>
                <div className={styles.convTop}>
                  <span className={styles.convSubject}>{c.subject}</span>
                  <span className={`${styles.statusBadge} ${statusClass(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{c.summary}</p>
                <div className={styles.convMeta}>
                  <span className={styles.channelTag}>
                    {c.channel === 'email' ? '✉️' : '💬'} {c.channel}
                  </span>
                  <span>Agent: {c.agent_name ?? c.assigned_agent}</span>
                  <span>{new Date(c.last_message_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Customers Page ─────────────────────────────────────────────── */
export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<Customer | null>(null);

  const user = authSession.getUser();
  const userId = user?.id || 'admin_acme';

  useEffect(() => {
    api.getCustomers(userId)
      .then(res => setCustomers(res.customers))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1>Customers</h1>
          <p>Manage all your workspace customers and their conversations</p>
        </div>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <span className={styles.countBadge}>
          {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { icon: '👥', label: 'Total Customers', value: customers.length, bg: '#eff6ff', iconBg: '#dbeafe' },
            { icon: '🔍', label: 'Filtered',        value: filtered.length,  bg: '#f5f3ff', iconBg: '#ede9fe' },
          ].map(s => (
            <div key={s.label} className={styles.stat} style={{ background: s.bg }}>
              <div className={styles.statIcon} style={{ background: s.iconBg }}>{s.icon}</div>
              <div>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statValue}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.loader}>
            <div className={styles.spinner} />
            <span>Loading customers…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <h3>No customers found</h3>
            <p>{search ? 'Try a different search term.' : 'No customers in this workspace yet.'}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            {/* Table Header */}
            <div className={styles.tableHead}>
              <span></span>
              <span>Name</span>
              <span>Email</span>
              <span>Joined</span>
              <span></span>
            </div>

            {/* Rows */}
            <div className={styles.tableBody}>
              {filtered.map(c => (
                <div key={c.customer_id} className={styles.row}>
                  <div className={styles.avatarCell}>
                    <div className={styles.avatar}>{c.avatar}</div>
                  </div>
                  <div className={styles.nameCell}>
                    <span className={styles.name}>{c.name}</span>
                  </div>
                  <span className={styles.emailCell}>{c.email}</span>
                  <span className={styles.joinedCell}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <div className={styles.actionCell}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => setSelected(c)}
                    >
                      💬 Conversations
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversations Drawer */}
      {selected && (
        <ConversationsDrawer
          customer={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

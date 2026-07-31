import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../../components/Avatar/Avatar';
import { StatCard } from '../../../components/StatCard/StatCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner/LoadingSpinner';
import { api } from '../../../services/api';
import type { Conversation } from '../../../types/api';
import { authSession } from '../../../utils/authSession';
import styles from './Dashboard.module.css';

export function AgentDashboardPage() {
  const user = authSession.getUser();
  const agentId = user?.id || 'agent_01';
  const agentName = user?.name || 'Alice Johnson';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getConversations(agentId);
        setConversations(res.conversations || []);
      } catch (err) {
        console.error('Failed to load agent conversations', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [agentId]);

  const totalCount = conversations.length;
  const openCount = conversations.filter((c) => c.status === 'open').length;
  const pendingCount = conversations.filter((c) => c.status === 'pending').length;
  const highPriorityCount = conversations.filter((c) => c.priority === 'high').length;
  const closedCount = conversations.filter((c) => c.status === 'closed').length;

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return styles.statusOpen;
      case 'pending':
        return styles.statusPending;
      default:
        return styles.statusClosed;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      default:
        return styles.priorityLow;
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.headerBanner}>
        <div>
          <h1 className={styles.welcomeTitle}>Welcome back, {agentName}! 👋</h1>
          <p className={styles.welcomeSub}>
            Here is what is happening with your assigned support queue today.
          </p>
        </div>
        <Link to="/agent/inbox" className={styles.inboxBtn}>
          Open Agent Inbox &rarr;
        </Link>
      </header>

      <div className={styles.statsGrid}>
        <StatCard title="Assigned Threads" value={totalCount} subtitle="Total in queue" />
        <StatCard title="Open Needs Reply" value={openCount} subtitle="Requires action" />
        <StatCard title="Pending Customer" value={pendingCount} subtitle="Awaiting reply" />
        <StatCard title="High Priority" value={highPriorityCount} subtitle="Urgent support" />
        <StatCard title="Resolved Threads" value={closedCount} subtitle="Completed" />
      </div>

      <div className={styles.panels}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Queue overview</p>
              <h2 className={styles.panelTitle}>Recent Assigned Conversations</h2>
            </div>
            <span className={styles.badge}>{conversations.length} Active</span>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading queue..." padding="1.5rem 1rem" />
          ) : conversations.length === 0 ? (
            <div className={styles.emptyState}>No conversations assigned to you yet.</div>
          ) : (
            <div className={styles.conversationList}>
              {conversations.slice(0, 5).map((conv) => (
                <Link
                  key={conv.conversation_id}
                  to="/agent/inbox"
                  className={styles.conversationCard}
                >
                  <div className={styles.userInfo}>
                    <Avatar
                      name={conv.customer_name || 'Customer'}
                      avatar={conv.customer_avatar}
                      size="md"
                    />
                    <div className={styles.convMeta}>
                      <span className={styles.customerName}>
                        {conv.customer_name || 'Customer #' + conv.customer_id.slice(0, 6)}
                      </span>
                      <span className={styles.convSubject}>
                        {conv.subject || conv.summary || 'No subject'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.tags}>
                    <span className={`${styles.tagStatus} ${getStatusClass(conv.status)}`}>
                      {conv.status}
                    </span>
                    <span className={`${styles.tagPriority} ${getPriorityClass(conv.priority)}`}>
                      {conv.priority}
                    </span>
                    <span className={styles.time}>
                      {new Date(conv.last_message_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Updates</p>
              <h2 className={styles.panelTitle}>Agent Feed</h2>
            </div>
            <span className={styles.badge}>Live</span>
          </div>

          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} />
              <div>
                <p className={styles.activityTitle}>Shift Active</p>
                <p className={styles.activityText}>Your queue is synced with Firebase Realtime DB.</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} />
              <div>
                <p className={styles.activityTitle}>Fast Response Target</p>
                <p className={styles.activityText}>Target first response time is under 5 minutes.</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} />
              <div>
                <p className={styles.activityTitle}>Auto Routing</p>
                <p className={styles.activityText}>New incoming tickets will route based on availability.</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

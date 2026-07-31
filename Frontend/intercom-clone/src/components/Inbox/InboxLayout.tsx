import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import type { Agent, Conversation } from '../../types/api';
import { ConversationDetail } from './ConversationDetail';
import { ConversationFilters } from './ConversationFilters';
import { ConversationList } from './ConversationList';
import styles from './InboxLayout.module.css';

interface Props {
  userId: string;
  userName: string;
}

export function InboxLayout({ userId, userName }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filters, setFilters] = useState<{ status?: string; channel?: string }>({});
  const [activeId, setActiveId] = useState<string | undefined>();

  // isInitialLoad: true only the very first time the list is being fetched
  // so we show the sidebar spinner only once, never again on silent refreshes
  const isInitialLoad = useRef(true);
  const [showListSpinner, setShowListSpinner] = useState(true);

  const cacheKey = `ticvic_convs_${userId}_${JSON.stringify(filters)}`;

  const fetchConversations = async (silent = false) => {
    try {
      const res = await api.getConversations(userId, filters);
      const newConvs = res.conversations || [];
      setConversations(newConvs);
      localStorage.setItem(cacheKey, JSON.stringify(newConvs));
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setShowListSpinner(false);
      isInitialLoad.current = false;
    }
  };

  // Re-fetch (with spinner) whenever filters or userId change
  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setConversations(parsed);
          setShowListSpinner(false);
        } else {
          setShowListSpinner(true);
        }
      } catch (err) {
        console.error('Failed to parse cached conversations', err);
        setShowListSpinner(true);
      }
    } else {
      setShowListSpinner(true);
    }
    fetchConversations(false);
  }, [userId, filters]);

  useEffect(() => {
    api.getAgents().then(res => setAgents(res.agents)).catch(console.error);
  }, []);

  // Called by ConversationDetail after a send or action — silent, no spinner
  const handleConversationUpdated = () => fetchConversations(true);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ConversationFilters filters={filters} onFilterChange={setFilters} />

        {showListSpinner ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <span>Loading...</span>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
          />
        )}
      </div>

      <div className={styles.main}>
        {activeId ? (
          <ConversationDetail
            key={activeId}
            conversationId={activeId}
            userId={userId}
            userName={userName}
            agents={agents}
            onConversationUpdated={handleConversationUpdated}
          />
        ) : (
          <div className={styles.emptyState}>
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

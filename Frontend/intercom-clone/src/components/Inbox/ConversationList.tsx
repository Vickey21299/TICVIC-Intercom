import type { Conversation } from '../../types/api';
import styles from './ConversationList.module.css';

interface Props {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: Props) {
  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'Open': return styles.badgeOpen;
      case 'Closed': return styles.badgeClosed;
      case 'Pending': return styles.badgePending;
      case 'Snoozed': return styles.badgeSnoozed;
      default: return '';
    }
  };

  return (
    <div className={styles.list}>
      {conversations.map((conv) => (
        <div
          key={conv.conversation_id}
          className={`${styles.card} ${activeId === conv.conversation_id ? styles.cardActive : ''}`}
          onClick={() => onSelect(conv.conversation_id)}
        >
          <div className={styles.header}>
            <span className={styles.customer}>{conv.customer_name || 'Unknown'}</span>
            <span className={styles.time}>
              {new Date(conv.last_message_at).toLocaleDateString()}
            </span>
          </div>
          <div className={styles.subject}>{conv.subject}</div>
          <div className={styles.meta}>
            <span className={`${styles.badge} ${getBadgeClass(conv.status)}`}>
              {conv.status}
            </span>
            <span>•</span>
            <span style={{ textTransform: 'capitalize' }}>{conv.channel}</span>
            {conv.agent_name && (
              <>
                <span>•</span>
                <span>{conv.agent_name}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import type { Agent, Conversation } from '../../types/api';
import styles from './InboxActions.module.css';

interface Props {
  conversation: Conversation;
  agents: Agent[];
  onUpdate: (updates: { status?: string; assigned_agent?: string }) => void;
}

export function InboxActions({ conversation, agents, onUpdate }: Props) {
  const handleAssign = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ assigned_agent: e.target.value });
  };

  return (
    <div className={styles.actions}>
      <div className={styles.customerInfo}>
        <div className={styles.avatar}>
          {conversation.customer_avatar || 'U'}
        </div>
        <div className={styles.details}>
          <h3>{conversation.customer_name || 'Unknown User'}</h3>
          <p>{conversation.subject}</p>
        </div>
      </div>
      
      <div className={styles.buttons}>
        <select
          className={styles.assignSelect}
          value={conversation.assigned_agent || ''}
          onChange={handleAssign}
        >
          <option value="" disabled>Assign to...</option>
          {agents.map(a => (
            <option key={a.user_id} value={a.user_id}>
              {a.name}
            </option>
          ))}
        </select>
        
        {conversation.status !== 'Snoozed' && (
          <button 
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => onUpdate({ status: 'Snoozed' })}
          >
            Snooze
          </button>
        )}
        
        {conversation.status !== 'Closed' && (
          <button 
            className={`${styles.button} ${styles.primary}`}
            onClick={() => onUpdate({ status: 'Closed' })}
          >
            Resolve
          </button>
        )}
        
        {conversation.status === 'Closed' && (
          <button 
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => onUpdate({ status: 'Open' })}
          >
            Reopen
          </button>
        )}
      </div>
    </div>
  );
}

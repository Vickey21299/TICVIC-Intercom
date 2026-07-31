import type { Message } from '../../types/api';
import styles from './MessageBubble.module.css';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isAgent = message.sender_type === 'agent';
  
  return (
    <div className={`${styles.bubbleContainer} ${isAgent ? styles.agent : styles.customer}`}>
      <div className={styles.content}>
        {message.content}
      </div>
      <div className={styles.meta}>
        <span>{message.sender_name}</span>
        <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

import { useState } from 'react';
import styles from './MessageInput.module.css';

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!content.trim()) return;
    onSend(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <textarea
        className={styles.textarea}
        placeholder="Type a reply... (Enter to send, Shift+Enter for new line)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button 
        className={styles.sendButton} 
        onClick={handleSend}
        disabled={disabled || !content.trim()}
      >
        Send
      </button>
    </div>
  );
}

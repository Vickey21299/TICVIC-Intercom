import styles from './ConversationFilters.module.css';

interface Props {
  onFilterChange: (filters: { status?: string; channel?: string }) => void;
  filters: { status?: string; channel?: string };
}

export function ConversationFilters({ onFilterChange, filters }: Props) {
  const handleChange = (key: 'status' | 'channel', value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className={styles.filters}>
      <div className={styles.row}>
        <select
          className={styles.select}
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Pending">Pending</option>
          <option value="Snoozed">Snoozed</option>
          <option value="Closed">Closed</option>
        </select>
        
        <select
          className={styles.select}
          value={filters.channel || ''}
          onChange={(e) => handleChange('channel', e.target.value)}
        >
          <option value="">All Channels</option>
          <option value="chat">Chat</option>
          <option value="email">Email</option>
        </select>
      </div>
    </div>
  );
}

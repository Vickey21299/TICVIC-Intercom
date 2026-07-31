import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  label?: string;
  padding?: string;
}

export function LoadingSpinner({ label = 'Loading...', padding }: LoadingSpinnerProps) {
  return (
    <div className={styles.container} style={padding ? { padding } : undefined}>
      <div className={styles.spinner} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

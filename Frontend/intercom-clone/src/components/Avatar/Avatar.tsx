import styles from './Avatar.module.css';

const GRADIENTS = [
  'linear-gradient(135deg, #0ea5e9, #2563eb)',
  'linear-gradient(135deg, #10b981, #0284c7)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #3b82f6)',
  'linear-gradient(135deg, #06b6d4, #6366f1)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
];

export interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
}

export function Avatar({ name, avatar, size = 'md', online }: AvatarProps) {
  const isUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:'));
  
  // Calculate deterministic gradient based on name string sum
  let charSum = 0;
  for (let i = 0; i < (name || '').length; i++) {
    charSum += name.charCodeAt(i);
  }
  const bgGradient = GRADIENTS[charSum % GRADIENTS.length];

  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const sizeClass =
    size === 'sm'
      ? styles.sizeSm
      : size === 'lg'
      ? styles.sizeLg
      : size === 'xl'
      ? styles.sizeXl
      : styles.sizeMd;

  return (
    <div className={styles.avatarWrap}>
      <div
        className={`${styles.avatar} ${sizeClass}`}
        style={{ background: isUrl ? 'transparent' : bgGradient }}
      >
        {isUrl ? (
          <img src={avatar} alt={name} className={styles.avatarImg} />
        ) : (
          <span>{avatar && avatar.length <= 3 ? avatar : initials}</span>
        )}
      </div>

      {online !== undefined && (
        <span
          className={`${styles.onlineDot} ${online ? styles.dotOnline : styles.dotOffline}`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

import styles from './StatCard.module.css'

type StatCardProps = {
  title: string
  value: string | number
  subtitle: string
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <article className={styles.card}>
      <p className={styles.title}>{title}</p>
      <p className={styles.value}>{value}</p>
      <p className={styles.subtitle}>{subtitle}</p>
    </article>
  )
}

import { Card } from '../../components/Card/Card'
import styles from './Dashboard.module.css'

export function DashboardPage() {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Admin Dashboard</h1>
      </Card>
    </main>
  )
}

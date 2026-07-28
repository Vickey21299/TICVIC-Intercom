import { StatCard } from '../../../components/StatCard/StatCard'
import styles from './Dashboard.module.css'

const dashboardStats = [
  { title: 'Open Conversations', value: 48, subtitle: '+8 today' },
  { title: 'Waiting Replies', value: 12, subtitle: '-2 since morning' },
  { title: 'Resolved Today', value: 91, subtitle: '+14 from yesterday' },
  { title: 'Online Agents', value: 6, subtitle: '2 on break' },
  { title: 'Active Visitors', value: 134, subtitle: '+22 in the last hour' },
  { title: 'Average Response Time', value: '2m 14s', subtitle: '-18% this week' },
]

export function DashboardPage() {
  return (
    <section className={styles.page}>
      <div className={styles.statsGrid}>
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      <div className={styles.panels}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Overview</p>
              <h2 className={styles.panelTitle}>Conversation Trend</h2>
            </div>
            <span className={styles.placeholderBadge}>Chart coming soon</span>
          </div>
          <div className={styles.chartPlaceholder} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Live feed</p>
              <h2 className={styles.panelTitle}>Recent Activity</h2>
            </div>
            <span className={styles.placeholderBadge}>UI placeholder</span>
          </div>

          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} />
              <div>
                <p className={styles.activityTitle}>New conversation assigned</p>
                <p className={styles.activityText}>A customer from the website was routed to Support.</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} />
              <div>
                <p className={styles.activityTitle}>Knowledge article updated</p>
                <p className={styles.activityText}>The onboarding guide was refreshed for new users.</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} />
              <div>
                <p className={styles.activityTitle}>Team status changed</p>
                <p className={styles.activityText}>Two agents went online and one agent is on break.</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

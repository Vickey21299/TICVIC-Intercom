import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

export interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.shell}>
      <section className={styles.brandPanel} aria-label="Product introduction">
        <div className={styles.brandMark} aria-hidden="true">
          IC
        </div>
        <div className={styles.brandCopy}>
          <p className={styles.kicker}>Customer Communication Platform</p>
          <h1 className={styles.title}>TICVIC Intercom</h1>
          <p className={styles.description}>
            Manage customer conversations, route teams, and keep every support
            thread in one place.
          </p>
        </div>
      </section>

      <section className={styles.contentPanel} aria-label="Authentication form">
        <div className={styles.contentInner}>{children}</div>
      </section>
    </div>
  )
}

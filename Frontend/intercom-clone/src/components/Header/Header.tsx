import { useState } from 'react'
import { SearchBox } from '../SearchBox/SearchBox'
import styles from './Header.module.css'

type HeaderProps = {
  pageTitle: string
  userName: string
  userRole: 'admin' | 'agent'
}

export function Header({ pageTitle, userName, userRole }: HeaderProps) {
  const [search, setSearch] = useState('')
  const roleTitle = userRole === 'admin' ? 'Admin' : 'Agent'
  const roleLabel = userRole === 'admin' ? 'Administrator' : 'Support Agent'
  const avatarText = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>{roleTitle}</p>
        <h1 className={styles.title}>{pageTitle}</h1>
      </div>

      <div className={styles.actions}>
        <SearchBox value={search} onChange={setSearch} placeholder="Search" />

        <button className={styles.iconButton} type="button" aria-label="Notifications">
          <svg viewBox="0 0 24 24" focusable="false" role="presentation" aria-hidden="true">
            <path
              d="M12 22a2.4 2.4 0 0 0 2.4-2.4h-4.8A2.4 2.4 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Zm-2 1H7v-6a5 5 0 0 1 10 0Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden="true">
            {avatarText}
          </div>
          <div className={styles.profileText}>
            <p className={styles.profileName}>{userName}</p>
            <p className={styles.profileRole}>{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

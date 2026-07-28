import { NavLink } from 'react-router-dom'
import type { DashboardRole, NavigationItem } from '../../types/navigation'
import styles from './Sidebar.module.css'

const iconPaths: Record<string, string> = {
  dashboard: 'M4 13h6V4H4v9Zm10 7h6V4h-6v16Zm-10 0h6v-5H4v5Zm10 0h6v-10h-6v10Z',
  inbox: 'M4 5h16v10h-5l-3 3-3-3H4V5Zm2 2v6h4l2 2 2-2h4V7H6Z',
  customers: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0Z',
  team: 'M8.5 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8.5 11Zm7 0A3 3 0 1 0 12.5 8 3 3 0 0 0 15.5 11ZM4 20a5.5 5.5 0 0 1 11 0Zm10.5 0a4.5 4.5 0 0 1 4.5-4.5 4.5 4.5 0 0 1 4.5 4.5Z',
  knowledgeBase: 'M6 4h12a2 2 0 0 1 2 2v12H8a2 2 0 0 0-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4h8v2H8Zm0 4h6v2H8Z',
  ai: 'M12 2l2.2 5.3L19.5 9.5 14.2 11.7 12 17l-2.2-5.3L4.5 9.5l5.3-2.2L12 2Zm0 8.2.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7Z',
  widget: 'M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z',
  analytics: 'M5 19V9h3v10H5Zm5 0V5h3v14h-3Zm5 0v-7h3v7h-3Zm5 0v-11h3v11h-3Z',
  profile: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0Z',
  settings: 'M12 8.5A3.5 3.5 0 1 0 15.5 12 3.5 3.5 0 0 0 12 8.5Zm9 3.5-.9-.3a8 8 0 0 0-.6-1.5l.5-.9a1 1 0 0 0-.2-1.2l-1.4-1.4a1 1 0 0 0-1.2-.2l-.9.5a8 8 0 0 0-1.5-.6L15.5 5a1 1 0 0 0-1-.8h-2a1 1 0 0 0-1 .8l-.3 1.1a8 8 0 0 0-1.5.6l-.9-.5a1 1 0 0 0-1.2.2L5.2 8.8a1 1 0 0 0-.2 1.2l.5.9a8 8 0 0 0-.6 1.5L4 12a1 1 0 0 0-.8 1v2a1 1 0 0 0 .8 1l.9.3a8 8 0 0 0 .6 1.5l-.5.9a1 1 0 0 0 .2 1.2l1.4 1.4a1 1 0 0 0 1.2.2l.9-.5a8 8 0 0 0 1.5.6l.3 1.1a1 1 0 0 0 1 .8h2a1 1 0 0 0 1-.8l.3-1.1a8 8 0 0 0 1.5-.6l.9.5a1 1 0 0 0 1.2-.2l1.4-1.4a1 1 0 0 0 .2-1.2l-.5-.9a8 8 0 0 0 .6-1.5l.9-.3a1 1 0 0 0 .8-1v-2a1 1 0 0 0-.8-1Z',
}

type SidebarIconName = keyof typeof iconPaths

function SidebarIcon({ name }: { name: SidebarIconName }) {
  return (
    <svg viewBox="0 0 24 24" focusable="false" role="presentation" aria-hidden="true">
      <path d={iconPaths[name]} fill="currentColor" />
    </svg>
  )
}

interface SidebarProps {
  items: NavigationItem[]
  workspaceName: string
  userRole: DashboardRole
}

export function Sidebar({ items, workspaceName, userRole }: SidebarProps) {
  const roleLabel = userRole === 'admin' ? 'Administrator' : 'Support Agent'

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden="true">
          <span />
          <span />
        </div>
        <div className={styles.brandText}>
          <p className={styles.brandName}>Intercom Clone</p>
          <p className={styles.workspace}>{workspaceName}</p>
          <p className={styles.roleBadge}>{roleLabel}</p>
        </div>
      </div>

      <nav className={styles.navigation} aria-label={`${userRole} navigation`}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`
            }
          >
            <span className={styles.navIcon} aria-hidden="true">
              <SidebarIcon name={item.icon} />
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

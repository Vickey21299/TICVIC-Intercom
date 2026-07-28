import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Sidebar } from '../../components/Sidebar/Sidebar'
import { getDashboardNavigation, getDashboardPageTitle } from '../../config/navigation'
import type { DashboardRole } from '../../types/navigation'
import styles from './DashboardLayout.module.css'

interface DashboardLayoutProps {
  role: DashboardRole
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const location = useLocation()
  const navigation = getDashboardNavigation(role)
  const pageTitle = getDashboardPageTitle(role, location.pathname)

  return (
    <div className={styles.shell}>
      <Sidebar
        items={navigation.items}
        workspaceName={navigation.workspaceName}
        userRole={navigation.role}
      />

      <div className={styles.contentPane}>
        <Header
          pageTitle={pageTitle}
          userName={navigation.userName}
          userRole={navigation.role}
        />

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

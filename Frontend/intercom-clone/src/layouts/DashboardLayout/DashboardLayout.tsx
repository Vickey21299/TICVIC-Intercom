import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Sidebar } from '../../components/Sidebar/Sidebar'
import { getDashboardNavigation, getDashboardPageTitle } from '../../config/navigation'
import type { DashboardRole } from '../../types/navigation'
import { authSession } from '../../utils/authSession'
import styles from './DashboardLayout.module.css'

interface DashboardLayoutProps {
  role: DashboardRole
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const location = useLocation()
  const user = authSession.getUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />
  }

  const navigation = getDashboardNavigation(role)
  const pageTitle = getDashboardPageTitle(role, location.pathname)

  // Dynamically map dynamic auth credentials
  const displayUserName = user.name || navigation.userName
  const displayWorkspaceName = 'Acme Support'

  return (
    <div className={styles.shell}>
      <Sidebar
        items={navigation.items}
        workspaceName={displayWorkspaceName}
        userRole={user.role}
      />

      <div className={styles.contentPane}>
        <Header
          pageTitle={pageTitle}
          userName={displayUserName}
          userRole={user.role}
        />

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

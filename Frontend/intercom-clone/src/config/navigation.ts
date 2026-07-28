import type { DashboardNavigationConfig, DashboardRole, NavigationItem } from '../types/navigation'

export const adminNavigation: NavigationItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', title: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/inbox', label: 'Inbox', title: 'Inbox', icon: 'inbox' },
  { path: '/admin/customers', label: 'Customers', title: 'Customers', icon: 'customers' },
  { path: '/admin/team', label: 'Team', title: 'Team', icon: 'team' },
  { path: '/admin/knowledge-base', label: 'Knowledge Base', title: 'Knowledge Base', icon: 'knowledgeBase' },
  { path: '/admin/ai', label: 'AI Assistant', title: 'AI Assistant', icon: 'ai' },
  { path: '/admin/widget', label: 'Widget', title: 'Widget', icon: 'widget' },
  { path: '/admin/analytics', label: 'Analytics', title: 'Analytics', icon: 'analytics' },
  { path: '/admin/settings', label: 'Settings', title: 'Settings', icon: 'settings' },
]

export const agentNavigation: NavigationItem[] = [
  { path: '/agent/dashboard', label: 'Dashboard', title: 'Dashboard', icon: 'dashboard' },
  { path: '/agent/inbox', label: 'Inbox', title: 'Inbox', icon: 'inbox' },
  { path: '/agent/customers', label: 'Customers', title: 'Customers', icon: 'customers' },
  { path: '/agent/profile', label: 'Profile', title: 'Profile', icon: 'profile' },
]

export const dashboardNavigation: Record<DashboardRole, DashboardNavigationConfig> = {
  admin: {
    role: 'admin',
    workspaceName: 'Demo Workspace',
    userName: 'John Doe',
    userRoleLabel: 'Administrator',
    items: adminNavigation,
  },
  agent: {
    role: 'agent',
    workspaceName: 'Demo Workspace',
    userName: 'Emma Smith',
    userRoleLabel: 'Support Agent',
    items: agentNavigation,
  },
}

export function getDashboardNavigation(role: DashboardRole) {
  return dashboardNavigation[role]
}

export function getDashboardPageTitle(role: DashboardRole, pathname: string) {
  const navigation = getDashboardNavigation(role)
  const matchedItem = navigation.items.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  )

  return matchedItem?.title ?? navigation.items[0]?.title ?? 'Dashboard'
}

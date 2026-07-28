export type DashboardRole = 'admin' | 'agent'

export type NavigationIcon =
  | 'dashboard'
  | 'inbox'
  | 'customers'
  | 'team'
  | 'knowledgeBase'
  | 'ai'
  | 'widget'
  | 'analytics'
  | 'settings'
  | 'profile'

export interface NavigationItem {
  path: string
  label: string
  title: string
  icon: NavigationIcon
}

export interface DashboardNavigationConfig {
  role: DashboardRole
  workspaceName: string
  userName: string
  userRoleLabel: string
  items: NavigationItem[]
}

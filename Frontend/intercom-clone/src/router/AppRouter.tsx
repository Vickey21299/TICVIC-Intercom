import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout/DashboardLayout'
import { AIAssistantPage } from '../pages/admin/AIAssistant/AIAssistant'
import { AnalyticsPage } from '../pages/admin/Analytics/Analytics'
import { CustomersPage } from '../pages/admin/Customers/Customers'
import { DashboardPage } from '../pages/admin/Dashboard/Dashboard'
import { InboxPage } from '../pages/admin/Inbox/Inbox'
import { KnowledgeBasePage } from '../pages/admin/KnowledgeBase/KnowledgeBase'
import { SettingsPage } from '../pages/admin/Settings/Settings'
import { TeamPage } from '../pages/admin/Team/Team'
import { WidgetPage } from '../pages/admin/Widget/Widget'
import { AgentCustomersPage } from '../pages/agent/Customers/Customers'
import { AgentDashboardPage } from '../pages/agent/Dashboard/Dashboard'
import { AgentInboxPage } from '../pages/agent/Inbox/Inbox'
import { AgentProfilePage } from '../pages/agent/Profile/Profile'
import { LoginPage } from '../pages/Login/Login'
import { KnowledgeBaseReaderPage } from '../pages/KnowledgeBaseReader/KnowledgeBaseReader'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/knowledge-base/:slug" element={<KnowledgeBaseReaderPage />} />
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="ai" element={<AIAssistantPage />} />
          <Route path="widget" element={<WidgetPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/agent" element={<DashboardLayout role="agent" />}>
          <Route index element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="dashboard" element={<AgentDashboardPage />} />
          <Route path="inbox" element={<AgentInboxPage />} />
          <Route path="customers" element={<AgentCustomersPage />} />
          <Route path="profile" element={<AgentProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

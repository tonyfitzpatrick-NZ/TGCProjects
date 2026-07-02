import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast/ToastContext'   // ← Added
import DashboardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import DeadlinesPage from './pages/DeadlinesPage'
import AdminUsersPage from './pages/AdminUsersPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import UploadsPage from './pages/UploadsPage'
import TasksAdminPage from './pages/TasksAdminPage'
import ConsultantReportPage from './pages/ConsultantReportPage'
import DocumentsPage from './pages/DocumentsPage'
import AdminApplicationTemplatesPage from './pages/AdminApplicationTemplatesPage'
import BackupExportPage from './pages/BackupExportPage'
import SpecificationBuilderPage from './pages/SpecificationBuilderPage'
import AdminSchedulePage from './pages/AdminSchedulePage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: '#aaa', fontSize: '14px' }}>
      Loading…
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>           {/* ← Added ToastProvider here */}
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/projects/:id" element={<ProjectDetailPage />} />
                    <Route path="/deadlines" element={<DeadlinesPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/uploads" element={<UploadsPage />} />
                    <Route path="/tasks" element={<TasksAdminPage />} />
                    <Route path="/consultants" element={<ConsultantReportPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/onedrive" element={<OneDrivePage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/settings" element={<SettingsPage />} />
                    <Route path="/admin/applications" element={<AdminApplicationTemplatesPage />} />
                    <Route path="/admin/backup" element={<BackupExportPage />} />
                    <Route path="/admin/specification-builder" element={<SpecificationBuilderPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin/schedule" element={<AdminSchedulePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

function OneDrivePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
        OneDrive
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: '#aaa' }}>
        <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px', lineHeight: '1.6' }}>
          OneDrive files are linked per project. Open any project and go to the <strong>Files tab</strong> to access OneDrive links, or click the <strong>Open project OneDrive folder</strong> button.
        </div>
        <a href="https://onedrive.live.com" target="_blank" rel="noreferrer"
          style={{ padding: '8px 18px', background: '#1B2B4B', color: '#fff', borderRadius: '8px', fontSize: '13px', textDecoration: 'none' }}>
          Open OneDrive
        </a>
      </div>
    </div>
  )
}

export default App

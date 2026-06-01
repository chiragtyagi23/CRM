import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'

import { ProtectedRoute } from './acl/ProtectedRoute'
import { AppMain } from './components/AppMain'
import { ToastProvider } from './components/acl/Toast'
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout'
import { BulkUploadLeads } from './pages/BulkUploadLeads'
import { CampaignBuilder } from './pages/CampaignBuilder'
import { CampaignList } from './pages/CampaignList'
import { CaptureLead } from './pages/CaptureLead'
import { Dashboard } from './pages/Dashboard'
import { Forbidden } from './pages/Forbidden'
import { Home } from './pages/Home'
import { LeadDetails } from './pages/LeadDetails'
import { Leads } from './pages/Leads'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { Reports } from './pages/Reports'
import { SessionExpired } from './pages/SessionExpired'
import { Signup } from './pages/Signup'
import { SiteVisits } from './pages/SiteVisits'
import { Unauthorized } from './pages/Unauthorized'
import { AclManagement } from './pages/admin/AclManagement'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { hydrateAuth } from './store/authSlice'
import './styles/acl-admin.css'
import CampaignDetails from './pages/CampaignDetails'

function CampaignEditRoute() {
  const params = useParams()
  const campaignId = params.id ? decodeURIComponent(params.id) : ''
  if (!campaignId) return <Navigate to="/campaign" replace />
  return <CampaignBuilder initialCampaignId={campaignId} />
}

function LeadDetailsRoute() {
  const params = useParams()
  const leadId = params.id ?? ''
  if (!leadId) return <Navigate to="/leads" replace />
  return <LeadDetails leadId={leadId} />
}

function CampaignModule() {
  return (
    <ProtectedRoute moduleKey="campaign">
      <AppMain id="campaign">
        <Outlet />
      </AppMain>
    </ProtectedRoute>
  )
}

function App() {
  const dispatch = useAppDispatch()
  const { token } = useAppSelector((s) => s.auth)

  useEffect(() => {
    dispatch(hydrateAuth())
  }, [dispatch])

  return (
    <ToastProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Home />} />
          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" replace /> : <AppMain id="login" narrow><Login /></AppMain>}
          />
          <Route
            path="/signup"
            element={token ? <Navigate to="/dashboard" replace /> : <AppMain id="signup" narrow><Signup /></AppMain>}
          />
          <Route path="/unauthorized" element={<AppMain id="unauthorized" narrow><Unauthorized /></AppMain>} />
          <Route path="/session-expired" element={<AppMain id="session-expired" narrow><SessionExpired /></AppMain>} />

          <Route element={<AuthenticatedLayout />}>
            <Route path="/403" element={<AppMain id="forbidden"><Forbidden /></AppMain>} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute moduleKey="dashboard">
                  <AppMain id="dashboard"><Dashboard /></AppMain>
                </ProtectedRoute>
              }
            />
            <Route path="/campaign" element={<CampaignModule />}>
              <Route index element={<CampaignList />} />
              <Route path="new" element={<CampaignBuilder />} />
              <Route path="edit/:id" element={<CampaignEditRoute />} />
              <Route path=":id" element={<CampaignDetails />} />
            </Route>
            <Route
              path="/leads"
              element={
                <ProtectedRoute moduleKey="leads">
                  <AppMain id="leads"><Leads /></AppMain>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/viewdetail/:id"
              element={
                <ProtectedRoute moduleKey="leads">
                  <AppMain id="lead-details"><LeadDetailsRoute /></AppMain>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/bulk-upload"
              element={
                <ProtectedRoute moduleKey="leads">
                  <AppMain id="leads-bulk-upload"><BulkUploadLeads /></AppMain>
                </ProtectedRoute>
              }
            />
            <Route
              path="/capture-lead"
              element={
                <ProtectedRoute moduleKey="capture_lead">
                  <AppMain id="capture-lead" narrow><CaptureLead /></AppMain>
                </ProtectedRoute>
              }
            />
            <Route
              path="/site-visits"
              element={
                <ProtectedRoute moduleKey="site_visits">
                  <AppMain id="site-visits"><SiteVisits /></AppMain>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute moduleKey="reports">
                  <AppMain id="reports"><Reports /></AppMain>
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<AppMain id="profile"><Profile /></AppMain>} />
            <Route
              path="/admin/acl"
              element={
                <ProtectedRoute moduleKey="admin_acl">
                  <AppMain id="admin-acl"><AclManagement /></AppMain>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </div>
    </ToastProvider>
  )
}

export default App

import { useEffect } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { AppMain } from './components/AppMain'
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout'
import { BulkUploadLeads } from './pages/BulkUploadLeads'
import { CampaignBuilder } from './pages/CampaignBuilder'
import { CampaignList } from './pages/CampaignList'
import { CaptureLead } from './pages/CaptureLead'
import { Dashboard } from './pages/Dashboard'
import { Home } from './pages/Home'
import { LeadDetails } from './pages/LeadDetails'
import { Leads } from './pages/Leads'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { Reports } from './pages/Reports'
import { Signup } from './pages/Signup'
import { SiteVisits } from './pages/SiteVisits'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { hydrateAuth } from './store/authSlice'

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

function App() {
  const dispatch = useAppDispatch()
  const { token } = useAppSelector((s) => s.auth)

  useEffect(() => {
    dispatch(hydrateAuth())
  }, [dispatch])

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AppMain id="login">
                <Login />
              </AppMain>
            )
          }
        />
        <Route
          path="/signup"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AppMain id="signup">
                <Signup />
              </AppMain>
            )
          }
        />

        <Route element={<AuthenticatedLayout />}>
          <Route
            path="/dashboard"
            element={
              <AppMain id="dashboard">
                <Dashboard />
              </AppMain>
            }
          />
          <Route
            path="/campaign"
            element={
              <AppMain id="campaign">
                <CampaignList />
              </AppMain>
            }
          />
          <Route
            path="/campaign/new"
            element={
              <AppMain id="campaign">
                <CampaignBuilder />
              </AppMain>
            }
          />
          <Route
            path="/campaign/edit/:id"
            element={
              <AppMain id="campaign">
                <CampaignEditRoute />
              </AppMain>
            }
          />
          <Route
            path="/leads"
            element={
              <AppMain id="leads">
                <Leads />
              </AppMain>
            }
          />
          <Route
            path="/leads/viewdetail/:id"
            element={
              <AppMain id="lead-details">
                <LeadDetailsRoute />
              </AppMain>
            }
          />
          <Route
            path="/leads/bulk-upload"
            element={
              <AppMain id="leads-bulk-upload">
                <BulkUploadLeads />
              </AppMain>
            }
          />
          <Route
            path="/capture-lead"
            element={
              <AppMain id="capture-lead">
                <CaptureLead />
              </AppMain>
            }
          />
          <Route
            path="/site-visits"
            element={
              <AppMain id="site-visits">
                <SiteVisits />
              </AppMain>
            }
          />
          <Route
            path="/reports"
            element={
              <AppMain id="reports">
                <Reports />
              </AppMain>
            }
          />
          <Route
            path="/profile"
            element={
              <AppMain id="profile">
                <Profile />
              </AppMain>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App

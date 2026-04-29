import { AppHeader } from './components/AppHeader'
import { useEffect } from 'react'
import { CampaignBuilder } from './pages/CampaignBuilder'
import { CampaignList } from './pages/CampaignList'
import { Dashboard } from './pages/Dashboard'
import { Leads } from './pages/Leads'
import { CaptureLead } from './pages/CaptureLead'
import { SiteVisits } from './pages/SiteVisits'
import { Reports } from './pages/Reports'
import { LeadDetails } from './pages/LeadDetails'
import { BulkUploadLeads } from './pages/BulkUploadLeads'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Home } from './pages/Home'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { authActions, hydrateAuth } from './store/authSlice'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'

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
  const { token, user } = useAppSelector((s) => s.auth)
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  useEffect(() => {
    dispatch(hydrateAuth())
  }, [dispatch])

  useEffect(() => {
    if (pathname !== '/leads/bulk-upload') return
    if (!token || user?.role !== 'admin') {
      navigate('/leads', { replace: true })
    }
  }, [pathname, token, user?.role, navigate])

  const hasRole = user?.role === 'admin' || user?.role === 'user'
  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/signup'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="app-shell">
      {!isPublicRoute && hasRole ? <AppHeader /> : null}
      <Routes>
        <Route path="/" element={token && hasRole ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route
          path="/login"
          element={
            token && hasRole ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <main className="app-main" id="login" style={{ backgroundColor: '#f6efe4' }}>
                <Login />
              </main>
            )
          }
        />
        <Route
          path="/signup"
          element={
            token && hasRole ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <main className="app-main" id="signup" style={{ backgroundColor: '#f6efe4' }}>
                <Signup />
              </main>
            )
          }
        />

        {!token ? (
          <Route path="*" element={<Navigate to="/" replace />} />
        ) : !hasRole ? (
          <Route
            path="*"
            element={
              <main className="app-main" id="no-role" style={{ backgroundColor: '#f6efe4' }}>
                <div className="mx-auto box-border w-full max-w-[900px] px-4 py-10">
                  <div className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 text-[13px] text-gray-600 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
                    <div className="text-[16px] font-semibold text-gray-900">No role assigned</div>
                    <div className="mt-1">
                      Your account is created, but you don’t have access yet. Please ask an admin to assign you a role (admin/user) in
                      the database.
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-[#80654a] px-5 text-[12px] font-semibold text-white hover:bg-[#725940]"
                        onClick={() => {
                          dispatch(authActions.logout())
                          navigate('/login', { replace: true })
                        }}
                      >
                        Logout
                      </button>
                    </div>
                    <div className="mt-3 text-[12px] font-medium text-gray-500">Error: you are not admin, not user.</div>
                  </div>
                </div>
              </main>
            }
          />
        ) : (
          <>
            <Route path="/dashboard" element={<main className="app-main" id="dashboard" style={{ backgroundColor: '#f6efe4' }}><Dashboard /></main>} />
            <Route path="/campaign" element={isAdmin ? <main className="app-main" id="campaign" style={{ backgroundColor: '#f6efe4' }}><CampaignList /></main> : <Navigate to="/dashboard" replace />} />
            <Route path="/campaign/new" element={isAdmin ? <main className="app-main" id="campaign" style={{ backgroundColor: '#f6efe4' }}><CampaignBuilder /></main> : <Navigate to="/dashboard" replace />} />
            <Route path="/campaign/edit/:id" element={isAdmin ? <main className="app-main" id="campaign" style={{ backgroundColor: '#f6efe4' }}><CampaignEditRoute /></main> : <Navigate to="/dashboard" replace />} />
            <Route path="/leads" element={<main className="app-main" id="leads" style={{ backgroundColor: '#f6efe4' }}><Leads /></main>} />
            <Route path="/leads/viewdetail/:id" element={<main className="app-main" id="lead-details" style={{ backgroundColor: '#f6efe4' }}><LeadDetailsRoute /></main>} />
            <Route path="/leads/bulk-upload" element={isAdmin ? <main className="app-main" id="leads-bulk-upload" style={{ backgroundColor: '#f6efe4' }}><BulkUploadLeads /></main> : <Navigate to="/leads" replace />} />
            <Route path="/capture-lead" element={isAdmin ? <main className="app-main" id="capture-lead" style={{ backgroundColor: '#f6efe4' }}><CaptureLead /></main> : <Navigate to="/dashboard" replace />} />
            <Route path="/site-visits" element={<main className="app-main" id="site-visits" style={{ backgroundColor: '#f6efe4' }}><SiteVisits /></main>} />
            <Route path="/reports" element={<main className="app-main" id="reports" style={{ backgroundColor: '#f6efe4' }}><Reports /></main>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </div>
  )
}

export default App

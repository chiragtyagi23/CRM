import { AppHeader } from './components/AppHeader'
import { Campaign } from './pages/Campaign'
import { useEffect, useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Leads } from './pages/Leads'
import { CaptureLead } from './pages/CaptureLead'
import { SiteVisits } from './pages/SiteVisits'
import { Reports } from './pages/Reports'
import { LeadDetails } from './pages/LeadDetails'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Home } from './pages/Home'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { authActions, hydrateAuth } from './store/authSlice'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#home')

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#dashboard')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return hash
}

function App() {
  const dispatch = useAppDispatch()
  const { token, user } = useAppSelector((s) => s.auth)
  const hash = useHashRoute()
  const isHome = hash === '#home' || hash === ''
  const isLogin = hash === '#login'
  const isSignup = hash === '#signup'
  const isCampaign = hash === '#campaign'
  const isLeads = hash === '#leads'
  const isLeadDetails = hash.startsWith('#leads/viewdetail/')
  const isCaptureLead = hash === '#capture-lead'
  const isSiteVisits = hash === '#site-visits'
  const isReports = hash === '#reports'
  const leadDetailsId = isLeadDetails ? hash.replace('#leads/viewdetail/', '') : ''

  useEffect(() => {
    dispatch(hydrateAuth())
  }, [dispatch])

  // Basic auth guard (UI-only): force login for app pages.
  useEffect(() => {
    if (!token && !isHome && !isLogin && !isSignup) window.location.hash = '#home'
    if (token && (isLogin || isSignup) && (user?.role === 'admin' || user?.role === 'user')) window.location.hash = '#dashboard'
    if (token && isHome && (user?.role === 'admin' || user?.role === 'user')) window.location.hash = '#dashboard'
  }, [isHome, isLogin, isSignup, token, user?.role])

  const isAdmin = user?.role === 'admin'
  const hasRole = user?.role === 'admin' || user?.role === 'user'

  return (
    <div className="app-shell">
      {isHome || isLogin || isSignup ? null : hasRole ? <AppHeader /> : null}
      {isHome ? (
        <Home />
      ) : isLogin ? (
        <main className="app-main" id="login" style={{ backgroundColor: '#f6efe4' }}>
          <Login />
        </main>
      ) : isSignup ? (
        <main className="app-main" id="signup" style={{ backgroundColor: '#f6efe4' }}>
          <Signup />
        </main>
      ) : token && !hasRole ? (
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
                    window.location.hash = '#login'
                  }}
                >
                  Logout
                </button>
              </div>
              <div className="mt-3 text-[12px] font-medium text-gray-500">Error: you are not admin, not user.</div>
            </div>
          </div>
        </main>
      ) : isCampaign ? (
        <main className="app-main" id="campaign" style={{ backgroundColor: '#f6efe4' }}>
          {isAdmin ? (
            <Campaign />
          ) : (
            <div className="mx-auto box-border w-full max-w-[1280px] px-4 py-10">
              <div className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 text-[13px] text-gray-600 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
                <div className="text-[16px] font-semibold text-gray-900">Access restricted</div>
                <div className="mt-1">Your role does not have access to Campaign.</div>
                <button
                  type="button"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#80654a] px-5 text-[12px] font-semibold text-white hover:bg-[#725940]"
                  onClick={() => (window.location.hash = '#dashboard')}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </main>
      ) : isLeadDetails ? (
        <main className="app-main" id="lead-details" style={{ backgroundColor: '#f6efe4' }}>
          <LeadDetails leadId={leadDetailsId} />
        </main>
      ) : isLeads ? (
        <main className="app-main" id="leads" style={{ backgroundColor: '#f6efe4' }}>
          <Leads />
        </main>
      ) : isCaptureLead ? (
        <main className="app-main" id="capture-lead" style={{ backgroundColor: '#f6efe4' }}>
          {isAdmin ? (
            <CaptureLead />
          ) : (
            <div className="mx-auto box-border w-full max-w-[1280px] px-4 py-10">
              <div className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 text-[13px] text-gray-600 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
                <div className="text-[16px] font-semibold text-gray-900">Access restricted</div>
                <div className="mt-1">Your role does not have access to Capture Lead.</div>
                <button
                  type="button"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#80654a] px-5 text-[12px] font-semibold text-white hover:bg-[#725940]"
                  onClick={() => (window.location.hash = '#dashboard')}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </main>
      ) : isSiteVisits ? (
        <main className="app-main" id="site-visits" style={{ backgroundColor: '#f6efe4' }}>
          <SiteVisits />
        </main>
      ) : isReports ? (
        <main className="app-main" id="reports" style={{ backgroundColor: '#f6efe4' }}>
          <Reports />
        </main>
      ) : (
        <main className="app-main" id="dashboard" style={{ backgroundColor: '#f6efe4' }}>
          <Dashboard />
        </main>
      )}
    </div>
  )
}

export default App

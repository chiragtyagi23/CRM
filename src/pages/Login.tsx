import { useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { authActions, login } from '../store/authSlice'

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M5.25 7V5.75a3.75 3.75 0 1 1 7.5 0V7h.5A1.75 1.75 0 0 1 15 8.75v5.5A1.75 1.75 0 0 1 13.25 16h-8.5A1.75 1.75 0 0 1 3 14.25v-5.5A1.75 1.75 0 0 1 4.75 7h.5zm1.5 0h4.5V5.75a2.25 2.25 0 0 0-4.5 0V7z"
      />
    </svg>
  )
}

export function Login() {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length >= 1 && !loading, [email, loading, password])

  return (
    <section className="mx-auto box-border flex min-h-[calc(100vh-72px)] w-full max-w-[1100px] items-center px-4 py-10">
      <div className="grid w-full grid-cols-1 gap-8 min-[920px]:grid-cols-2 min-[920px]:items-center">
        <div className="hidden min-[920px]:block">
          <div className="rounded-3xl border border-gray-900/5 bg-[#FDFBF7] p-8 shadow-[0_20px_60px_rgba(17,24,39,0.08)]">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-[#faf6ef] px-4 py-2 text-[12px] font-semibold text-[#80654a]">
              <span className="text-[#80654a]">
                <IconLock />
              </span>
              Secure CRM Access
            </div>
            <div className="mt-5 text-[26px] font-bold tracking-[-0.03em] text-gray-900">Welcome back to PropCRM</div>
            <div className="mt-2 text-[13px] font-medium text-gray-500">
              Manage leads, schedule site visits, and track conversions — all in one place.
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4">
              <div className="rounded-2xl bg-white p-5">
                <div className="text-[12px] font-semibold text-gray-800">Tip</div>
                <div className="mt-1 text-[12px] text-gray-600">
                  This is UI-only right now. We’ll connect real authentication later.
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <div className="text-[12px] font-semibold text-gray-800">Theme</div>
                <div className="mt-1 text-[12px] text-gray-600">
                  Background <span className="font-semibold text-gray-800">#f6efe4</span> · Cards{' '}
                  <span className="font-semibold text-gray-800">#FDFBF7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-900/5 bg-[#FDFBF7] p-7 shadow-[0_20px_60px_rgba(17,24,39,0.08)] min-[520px]:p-9">
          <div className="text-[24px] font-bold tracking-[-0.03em] text-gray-900">Login</div>
          <div className="mt-1 text-[13px] font-medium text-gray-500">Sign in to continue</div>

          <form
            className="mt-7 flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!canSubmit) return
              try {
                const res = await dispatch(login({ email, password })).unwrap()
                const role = res.user.role
                if (role !== 'admin' && role !== 'user') {
                  window.alert('You are not authorised for this CRM portal. Please ask admin to assign role (admin/user) in database.')
                  dispatch(authActions.logout())
                  return
                }
                window.location.hash = '#dashboard'
              } catch {
                // handled via state
              }
            }}
          >
            <label className="block">
              <div className="mb-2 text-[12px] font-semibold text-gray-600">Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-3 text-[12px] font-semibold text-gray-600">
                <span>Password</span>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#80654a] hover:text-[#725940]"
                  onClick={() => window.alert('Forgot password (UI only)')}
                >
                  Forgot?
                </button>
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#80654a] text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940] disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {error ? <div className="text-[12px] font-medium text-rose-600">{error}</div> : null}

            <div className="mt-1 text-center text-[12px] text-gray-500">
              Don’t have an account?{' '}
              <a className="font-semibold text-[#80654a] hover:text-[#725940]" href="#signup">
                Create one
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}


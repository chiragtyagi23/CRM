import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { login } from '../store/authSlice'
import { defaultAuthedPath } from '../acl/hasAccess'
import { d } from '../lib/designClasses'

export function Login() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const emailTrimmed = email.trim()
  const emailError = useMemo(() => {
    if (!emailTrimmed) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) return 'Please enter a valid email address'
    return ''
  }, [emailTrimmed])
  const passwordError = useMemo(() => {
    if (!password.trim()) return 'Password is required'
    return ''
  }, [password])
  const canSubmit = useMemo(() => !emailError && !passwordError && !loading, [emailError, loading, passwordError])

  return (
    <section className="flex min-h-[60vh] w-full items-center py-6">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <div className={`${d.cardP6} p-8`}>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#F5EFE7] px-4 py-2 text-sm font-semibold text-[#8B7355]">
              <FiLock size={18} aria-hidden />
              Secure CRM Access
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#2E2E2E]">Welcome back to PropCRM</h2>
            <p className="mt-2 text-sm text-[#8B7355]">
              Manage leads, schedule site visits, and track conversions — all in one place.
            </p>
          </div>
        </div>

        <div className="crm-auth-card">
          <h2 className="text-2xl font-semibold text-[#2E2E2E]">Login</h2>
          <p className="mt-1 text-sm text-[#8B7355]">Sign in to continue</p>

          <form
            className="mt-7 flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!canSubmit) return
              try {
                const auth = await dispatch(login({ email, password })).unwrap()
                navigate(defaultAuthedPath(auth.access?.modules ?? []), { replace: true })
              } catch {
                // handled via state
              }
            }}
          >
            <label className="block">
              <span className={d.label}>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className={d.input}
              />
              {emailError ? <div className="mt-1 text-xs font-medium text-[#D96B6B]">{emailError}</div> : null}
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#8B7355]">Password</span>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-[#8B7355] hover:text-[#2E2E2E]"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`${d.input} pr-12`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#2E2E2E]"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <FiEyeOff size={18} aria-hidden /> : <FiEye size={18} aria-hidden />}
                </button>
              </div>
              {passwordError ? <div className="mt-1 text-xs font-medium text-[#D96B6B]">{passwordError}</div> : null}
            </label>

            <button type="submit" disabled={!canSubmit} className={`mt-2 w-full ${d.btnPrimary}`}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {error ? <div className="text-sm font-medium text-[#D96B6B]">{error}</div> : null}
          </form>
        </div>
      </div>
    </section>
  )
}

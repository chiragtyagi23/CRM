import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi'

import { resetPassword } from '../lib/authApi'
import type { ApiError } from '../lib/crmApi'
import { d } from '../lib/designClasses'

function extractError(err: unknown): string {
  const apiErr = err as ApiError | undefined
  const body = apiErr?.body as { error?: unknown } | undefined
  if (body && typeof body.error === 'string' && body.error.trim()) return body.error
  return apiErr?.message ?? 'Something went wrong'
}

function passwordStrengthError(password: string): string {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[a-z]/.test(password)) return 'Password must include at least 1 lowercase letter'
  if (!/[A-Z]/.test(password)) return 'Password must include at least 1 uppercase letter'
  if (!/\d/.test(password)) return 'Password must include at least 1 number'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least 1 special character'
  return ''
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const passwordError = useMemo(() => passwordStrengthError(password), [password])
  const confirmError = useMemo(() => {
    if (!confirm) return 'Please confirm your password'
    if (password !== confirm) return 'Passwords do not match'
    return ''
  }, [confirm, password])

  const canSubmit = Boolean(token) && !passwordError && !confirmError && !loading

  if (!token) {
    return (
      <section className="flex min-h-[60vh] w-full items-center justify-center py-6">
        <div className="crm-auth-card max-w-md">
          <h2 className="text-2xl font-semibold text-[#2E2E2E]">Invalid link</h2>
          <p className="mt-2 text-sm text-[#8B7355]">This reset link is missing or invalid. Request a new one.</p>
          <Link to="/forgot-password" className={`mt-6 inline-flex ${d.btnPrimary} h-11 items-center px-6`}>
            Request reset link
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-[60vh] w-full items-center py-6">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <div className={`${d.cardP6} p-8`}>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#F5EFE7] px-4 py-2 text-sm font-semibold text-[#8B7355]">
              <FiLock size={18} aria-hidden />
              New password
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#2E2E2E]">Choose a new password</h2>
            <p className="mt-2 text-sm text-[#8B7355]">Use at least 8 characters with upper, lower, number, and symbol.</p>
          </div>
        </div>

        <div className="crm-auth-card">
          <h2 className="text-2xl font-semibold text-[#2E2E2E]">Set new password</h2>
          <p className="mt-1 text-sm text-[#8B7355]">Enter and confirm your new password</p>

          {success ? (
            <div className="mt-7 rounded-xl border border-[#8B7355]/20 bg-[#F5EFE7] px-4 py-4 text-sm font-medium text-[#2E2E2E]">
              {success}
              <button
                type="button"
                className={`mt-4 ${d.btnPrimary} h-11 w-full`}
                onClick={() => navigate('/login', { replace: true })}
              >
                Go to login
              </button>
            </div>
          ) : (
            <form
              className="mt-7 flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!canSubmit) return
                setLoading(true)
                setError(null)
                try {
                  const res = await resetPassword({ token, password })
                  setSuccess(res.message)
                } catch (err) {
                  setError(extractError(err))
                } finally {
                  setLoading(false)
                }
              }}
            >
              <label className="block">
                <span className={d.label}>New password</span>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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
                {passwordError && password.length > 0 ? (
                  <div className="mt-1 text-xs font-medium text-[#D96B6B]">{passwordError}</div>
                ) : null}
              </label>

              <label className="block">
                <span className={d.label}>Confirm password</span>
                <div className="relative">
                  <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`${d.input} pr-12`}
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#2E2E2E]"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <FiEyeOff size={18} aria-hidden /> : <FiEye size={18} aria-hidden />}
                  </button>
                </div>
                {confirmError && confirm.length > 0 ? (
                  <div className="mt-1 text-xs font-medium text-[#D96B6B]">{confirmError}</div>
                ) : null}
              </label>

              <button type="submit" disabled={!canSubmit} className={`mt-2 w-full ${d.btnPrimary}`}>
                {loading ? 'Saving…' : 'Update password'}
              </button>

              {error ? <div className="text-sm font-medium text-[#D96B6B]">{error}</div> : null}

              <p className="mt-1 text-center text-sm text-[#8B7355]">
                <Link className="font-semibold text-[#8B7355] hover:text-[#2E2E2E]" to="/login">
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

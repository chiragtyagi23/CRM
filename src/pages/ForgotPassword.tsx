import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiLock } from 'react-icons/fi'

import { forgotPassword } from '../lib/authApi'
import type { ApiError } from '../lib/crmApi'
import { d } from '../lib/designClasses'

function extractError(err: unknown): string {
  const apiErr = err as ApiError | undefined
  const body = apiErr?.body as { error?: unknown } | undefined
  if (body && typeof body.error === 'string' && body.error.trim()) return body.error
  return apiErr?.message ?? 'Something went wrong'
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const emailTrimmed = email.trim()
  const emailError = useMemo(() => {
    if (!emailTrimmed) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) return 'Please enter a valid email address'
    return ''
  }, [emailTrimmed])

  const canSubmit = !emailError && !loading

  return (
    <section className="flex min-h-[60vh] w-full items-center py-6">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <div className={`${d.cardP6} p-8`}>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#F5EFE7] px-4 py-2 text-sm font-semibold text-[#8B7355]">
              <FiLock size={18} aria-hidden />
              Password recovery
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#2E2E2E]">Forgot your password?</h2>
            <p className="mt-2 text-sm text-[#8B7355]">
              Enter your account email and we will send you a link to choose a new password.
            </p>
          </div>
        </div>

        <div className="crm-auth-card">
          <h2 className="text-2xl font-semibold text-[#2E2E2E]">Reset password</h2>
          <p className="mt-1 text-sm text-[#8B7355]">We will email you a secure reset link</p>

          {success ? (
            <div className="mt-7 rounded-xl border border-[#8B7355]/20 bg-[#F5EFE7] px-4 py-4 text-sm font-medium text-[#2E2E2E]">
              {success}
              <div className="mt-4">
                <Link to="/login" className={`${d.btnPrimary} inline-flex h-11 items-center px-6`}>
                  Back to login
                </Link>
              </div>
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
                  const res = await forgotPassword({ email: emailTrimmed })
                  setSuccess(res.message)
                } catch (err) {
                  setError(extractError(err))
                } finally {
                  setLoading(false)
                }
              }}
            >
              <label className="block">
                <span className={d.label}>Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  type="email"
                  autoComplete="email"
                  className={d.input}
                />
                {emailError ? <div className="mt-1 text-xs font-medium text-[#D96B6B]">{emailError}</div> : null}
              </label>

              <button type="submit" disabled={!canSubmit} className={`mt-2 w-full ${d.btnPrimary}`}>
                {loading ? 'Sending…' : 'Send reset link'}
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

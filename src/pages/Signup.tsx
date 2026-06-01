import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { signup } from '../store/authSlice'

export function Signup() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const nameError = useMemo(() => {
    if (!name.trim()) return 'Full name is required'
    return ''
  }, [name])
  const emailError = useMemo(() => {
    const value = email.trim()
    if (!value) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
    return ''
  }, [email])
  const passwordError = useMemo(() => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[a-z]/.test(password)) return 'Password must include at least 1 lowercase letter'
    if (!/[A-Z]/.test(password)) return 'Password must include at least 1 uppercase letter'
    if (!/\d/.test(password)) return 'Password must include at least 1 number'
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least 1 special character'
    return ''
  }, [password])
  const confirmError = useMemo(() => {
    if (!confirm) return 'Please confirm your password'
    if (password !== confirm) return 'Passwords do not match'
    return ''
  }, [confirm, password])
  const canSubmit = useMemo(() => {
    return !nameError && !emailError && !passwordError && !confirmError && !loading
  }, [confirmError, emailError, loading, nameError, passwordError])

  return (
    <section className="mx-auto box-border flex min-h-[calc(100vh-72px)] w-full max-w-[1100px] items-center px-4 py-10">
      <div className="grid w-full grid-cols-1 gap-8 min-[920px]:grid-cols-2 min-[920px]:items-center">
        <div className="hidden min-[920px]:block">
          <div className="rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-8 ">
            <div className="inline-flex items-center gap-2 rounded-xl bg-[#F5EFE7] px-4 py-2 text-[12px] font-semibold text-[#8B7355]">
              <span className="text-[#8B7355]">
                <FiUserPlus size={18} aria-hidden />
              </span>
              Create your CRM account
            </div>
            <div className="mt-5 text-[26px] font-bold tracking-[-0.03em] text-[#2E2E2E]">Start organizing leads today</div>
            <div className="mt-2 text-[13px] font-medium text-[#8B7355]">
              Faster follow-ups, better qualification, and clean reporting across your team.
            </div>

            <div className="mt-8 rounded-xl bg-white p-5">
              <div className="text-[12px] font-semibold text-[#2E2E2E]">Note</div>
              <div className="mt-1 text-[12px] text-[#8B7355]">
                Signup is UI-only for now. We’ll connect real auth later.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-7  min-[520px]:p-9">
          <div className="text-2xl font-semibold text-[#2E2E2E]">Sign up</div>
          <div className="mt-1 text-[13px] font-medium text-[#8B7355]">Create an account to continue</div>

          <form
            className="mt-7 flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!canSubmit || loading) return
              try {
                await dispatch(signup({ name, email, password })).unwrap()
                navigate('/login')
              } catch {
                // handled by state
              }
            }}
          >
            <label className="block">
              <div className="mb-2 text-[12px] font-semibold text-[#8B7355]">Full name</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-4 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355] focus:border-[#8B7355] focus:outline-none"
              />
              {nameError ? <div className="mt-1 text-[12px] font-medium text-[#D96B6B]">{nameError}</div> : null}
            </label>

            <label className="block">
              <div className="mb-2 text-[12px] font-semibold text-[#8B7355]">Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-4 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355] focus:border-[#8B7355] focus:outline-none"
              />
              {emailError ? <div className="mt-1 text-[12px] font-medium text-[#D96B6B]">{emailError}</div> : null}
            </label>

            <label className="block">
              <div className="mb-2 text-[12px] font-semibold text-[#8B7355]">Password</div>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-4 pr-12 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355] focus:border-[#8B7355] focus:outline-none"
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
              {passwordError ? <div className="mt-1 text-[12px] font-medium text-[#D96B6B]">{passwordError}</div> : null}
            </label>

            <label className="block">
              <div className="mb-2 text-[12px] font-semibold text-[#8B7355]">Confirm password</div>
              <div className="relative">
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-4 pr-12 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355] focus:border-[#8B7355] focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#2E2E2E]"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} aria-hidden /> : <FiEye size={18} aria-hidden />}
                </button>
              </div>
              {confirmError ? <div className="mt-1 text-[12px] font-medium text-[#D96B6B]">{confirmError}</div> : null}
            </label>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#8B7355] text-[13px] font-semibold text-white shadow-sm hover:bg-[#6d5a43] disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>

            {error ? <div className="text-[12px] font-medium text-[#D96B6B]">{error}</div> : null}

            <div className="mt-1 text-center text-[12px] text-[#8B7355]">
              Already have an account?{' '}
              <Link className="font-semibold text-[#8B7355] hover:text-[#6d5a43]" to="/login">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}


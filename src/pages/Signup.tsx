import { useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { authActions, signup } from '../store/authSlice'

function IconUserPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="6.25" cy="5.25" r="2.25" fill="currentColor" />
      <path
        fill="currentColor"
        d="M2.5 14.5c0-2.35 1.9-4.25 4.25-4.25.35 0 .68.04 1 .12v1.38h-.25c-1.66 0-3 1.34-3 3V15h-2v-.5z"
      />
      <path fill="currentColor" d="M12.5 6v1.25H11v1.5h1.5V10h1.5V8.75H15.5v-1.5H14V6h-1.5z" />
    </svg>
  )
}

export function Signup() {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const canSubmit = useMemo(() => {
    if (!name.trim() || !email.trim()) return false
    if (password.trim().length < 6) return false
    return password === confirm
  }, [confirm, email, name, password])

  return (
    <section className="mx-auto box-border flex min-h-[calc(100vh-72px)] w-full max-w-[1100px] items-center px-4 py-10">
      <div className="grid w-full grid-cols-1 gap-8 min-[920px]:grid-cols-2 min-[920px]:items-center">
        <div className="hidden min-[920px]:block">
          <div className="rounded-3xl border border-gray-900/5 bg-[#FDFBF7] p-8 shadow-[0_20px_60px_rgba(17,24,39,0.08)]">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-[#faf6ef] px-4 py-2 text-[12px] font-semibold text-[#80654a]">
              <span className="text-[#80654a]">
                <IconUserPlus />
              </span>
              Create your CRM account
            </div>
            <div className="mt-5 text-[26px] font-bold tracking-[-0.03em] text-gray-900">Start organizing leads today</div>
            <div className="mt-2 text-[13px] font-medium text-gray-500">
              Faster follow-ups, better qualification, and clean reporting across your team.
            </div>

            <div className="mt-8 rounded-2xl bg-white p-5">
              <div className="text-[12px] font-semibold text-gray-800">Note</div>
              <div className="mt-1 text-[12px] text-gray-600">
                Signup is UI-only for now. We’ll connect real auth later.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-900/5 bg-[#FDFBF7] p-7 shadow-[0_20px_60px_rgba(17,24,39,0.08)] min-[520px]:p-9">
          <div className="text-[24px] font-bold tracking-[-0.03em] text-gray-900">Sign up</div>
          <div className="mt-1 text-[13px] font-medium text-gray-500">Create an account to continue</div>

          <form
            className="mt-7 flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!canSubmit || loading) return
              try {
                const res = await dispatch(signup({ name, email, password })).unwrap()
                const role = res.user.role
                if (role !== 'admin' && role !== 'user') {
                  window.alert('You are not authorised to access CRM portal. Role is not set (admin/user). Admin will assign it in database.')
                  dispatch(authActions.logout())
                  window.location.hash = '#login'
                  return
                }
                window.location.hash = '#dashboard'
              } catch {
                // handled by state
              }
            }}
          >
            <label className="block">
              <div className="mb-2 text-[12px] font-semibold text-gray-600">Full name</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </label>

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
              <div className="mb-2 text-[12px] font-semibold text-gray-600">Password</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                type="password"
                autoComplete="new-password"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </label>

            <label className="block">
              <div className="mb-2 text-[12px] font-semibold text-gray-600">Confirm password</div>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                type="password"
                autoComplete="new-password"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#80654a] text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940] disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>

            {error ? <div className="text-[12px] font-medium text-rose-600">{error}</div> : null}

            <div className="mt-1 text-center text-[12px] text-gray-500">
              Already have an account?{' '}
              <a className="font-semibold text-[#80654a] hover:text-[#725940]" href="#login">
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}


import { useState } from 'react'
import { FiCheck, FiEye, FiEyeOff, FiLock, FiX } from 'react-icons/fi'

import { changeMyPassword } from '../../lib/profileApi'
import { btnGhost, btnPrimary, card, cardSubtitle, cardTitle, extractError, input } from './shared'

const RULES = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
  { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

const STRENGTH = [
  { label: 'Too weak', color: 'bg-[#D96B6B]' },
  { label: 'Weak', color: 'bg-[#D96B6B]' },
  { label: 'Fair', color: 'bg-[#D9A46B]' },
  { label: 'Good', color: 'bg-[#B08D57]' },
  { label: 'Strong', color: 'bg-[#5B8C5A]' },
  { label: 'Very strong', color: 'bg-[#5B8C5A]' },
]

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${input} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#8B7355] hover:bg-[#F5EFE7]"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
      </button>
    </div>
  )
}

export function SecurityCard() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const passed = RULES.filter((r) => r.test(next)).length
  const strength = STRENGTH[passed]
  const mismatch = confirm.length > 0 && confirm !== next
  const canSave = !saving && current.length > 0 && passed === RULES.length && confirm === next && next !== current

  const reset = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setError(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await changeMyPassword(current, next)
      setSuccess(res.message || 'Password updated')
      reset()
      setOpen(false)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="profile-security" className={`${card} scroll-mt-24`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE7] text-[#8B7355]">
            <FiLock size={16} aria-hidden />
          </span>
          <div>
            <h2 className={cardTitle}>Password &amp; security</h2>
            <p className={cardSubtitle}>Change the password you use to sign in</p>
          </div>
        </div>
        {!open ? (
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setOpen(true)
              setSuccess(null)
            }}
          >
            Change password
          </button>
        ) : null}
      </div>

      {success && !open ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#EEF5EE] px-3 py-2 text-[12px] font-semibold text-[#5B8C5A]">
          <FiCheck size={14} aria-hidden /> {success}
        </div>
      ) : null}

      {open ? (
        <form className="mt-5 grid gap-4 min-[720px]:grid-cols-2" onSubmit={(e) => void submit(e)}>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-[#8B7355]">Current password</span>
              <PasswordInput value={current} onChange={setCurrent} placeholder="Current password" autoComplete="current-password" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-[#8B7355]">New password</span>
              <PasswordInput value={next} onChange={setNext} placeholder="New password" autoComplete="new-password" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-[#8B7355]">Confirm new password</span>
              <PasswordInput value={confirm} onChange={setConfirm} placeholder="Repeat new password" autoComplete="new-password" />
              {mismatch ? <span className="mt-1 block text-[12px] font-medium text-[#D96B6B]">Passwords don’t match</span> : null}
            </label>
          </div>

          <div className="rounded-xl bg-[#FBF8F4] p-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#2E2E2E]">Strength</span>
              <span className="font-semibold text-[#8B7355]">{next ? strength.label : '—'}</span>
            </div>
            <div className="mt-2 flex gap-1">
              {RULES.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${next && i < passed ? strength.color : 'bg-[#E8DCCB]'}`} />
              ))}
            </div>
            <ul className="mt-4 space-y-1.5">
              {RULES.map((r) => {
                const ok = r.test(next)
                return (
                  <li key={r.label} className={`flex items-center gap-2 text-[12px] ${ok ? 'text-[#5B8C5A]' : 'text-[#8B7355]'}`}>
                    {ok ? <FiCheck size={13} aria-hidden /> : <FiX size={13} aria-hidden />} {r.label}
                  </li>
                )
              })}
              {next && current && next === current ? (
                <li className="text-[12px] text-[#D96B6B]">Must differ from your current password</li>
              ) : null}
            </ul>
          </div>

          {error ? <div className="text-[13px] font-medium text-[#D96B6B] min-[720px]:col-span-2">{error}</div> : null}

          <div className="flex justify-end gap-2 min-[720px]:col-span-2">
            <button
              type="button"
              className={btnGhost}
              disabled={saving}
              onClick={() => {
                reset()
                setOpen(false)
              }}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={!canSave}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

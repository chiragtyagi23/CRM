import { useState, type ReactNode } from 'react'
import { FiBriefcase, FiCheck, FiCopy, FiEdit2, FiLinkedin, FiMail, FiMapPin, FiPhone, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

import type { MyProfileDTO, MyProfilePatch } from '../../lib/profileApi'
import { toIndiaTelHref, toWhatsAppHref } from '../../utils/phone'
import { card, cardSubtitle, cardTitle, extractError, iconBtn, iconBtnDanger, input } from './shared'

type FieldKey = keyof MyProfilePatch

type FieldConfig = {
  key: FieldKey
  label: string
  icon: ReactNode
  placeholder: string
  inputType: 'tel' | 'text' | 'url'
  maxLength: number
  validate: (v: string) => string | null
}

function validatePhone(v: string) {
  if (!/^\+?[\d\s()-]+$/.test(v)) return 'Use digits, spaces, +, - or () only'
  const digits = v.replace(/\D/g, '').length
  if (digits < 10 || digits > 15) return 'Enter 10 to 15 digits'
  return null
}

const FIELDS: FieldConfig[] = [
  {
    key: 'phone',
    label: 'Contact number',
    icon: <FiPhone size={15} aria-hidden />,
    placeholder: '+91 98765 43210',
    inputType: 'tel',
    maxLength: 25,
    validate: validatePhone,
  },
  {
    key: 'designation',
    label: 'Designation',
    icon: <FiBriefcase size={15} aria-hidden />,
    placeholder: 'e.g. Senior Sales Manager',
    inputType: 'text',
    maxLength: 100,
    validate: () => null,
  },
  {
    key: 'location',
    label: 'Location',
    icon: <FiMapPin size={15} aria-hidden />,
    placeholder: 'e.g. Gurugram, Haryana',
    inputType: 'text',
    maxLength: 120,
    validate: () => null,
  },
  {
    key: 'linkedinUrl',
    label: 'LinkedIn',
    icon: <FiLinkedin size={15} aria-hidden />,
    placeholder: 'linkedin.com/in/your-name',
    inputType: 'url',
    maxLength: 300,
    validate: (v) => (/linkedin\.com/i.test(v) ? null : 'Must be a linkedin.com link'),
  },
]

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
    })
  }
  return { copied, copy }
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-3.5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE7] text-[#8B7355]">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8B7355]">{label}</div>
        {children}
      </div>
    </div>
  )
}

export function ContactDetailsCard({
  profile,
  onSave,
}: {
  profile: MyProfileDTO
  onSave: (patch: MyProfilePatch) => Promise<void>
}) {
  const [editing, setEditing] = useState<FieldKey | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState<FieldKey | null>(null)
  const [error, setError] = useState<{ key: FieldKey; message: string } | null>(null)
  const { copied, copy } = useCopy()

  const startEdit = (key: FieldKey) => {
    setEditing(key)
    setDraft(profile[key] ?? '')
    setError(null)
  }

  const cancel = () => {
    setEditing(null)
    setError(null)
  }

  const submit = async (field: FieldConfig) => {
    const value = draft.trim()
    if (!value) {
      setError({ key: field.key, message: `${field.label} cannot be empty — use Remove instead` })
      return
    }
    const invalid = field.validate(value)
    if (invalid) {
      setError({ key: field.key, message: invalid })
      return
    }
    setBusy(field.key)
    setError(null)
    try {
      await onSave({ [field.key]: value })
      setEditing(null)
    } catch (err) {
      setError({ key: field.key, message: extractError(err) })
    } finally {
      setBusy(null)
    }
  }

  const remove = async (field: FieldConfig) => {
    if (!window.confirm(`Remove your ${field.label.toLowerCase()}?`)) return
    setBusy(field.key)
    setError(null)
    try {
      await onSave({ [field.key]: null })
      if (editing === field.key) setEditing(null)
    } catch (err) {
      setError({ key: field.key, message: extractError(err) })
    } finally {
      setBusy(null)
    }
  }

  const renderValue = (field: FieldConfig, value: string) => {
    if (field.key === 'phone') {
      const tel = toIndiaTelHref(value) ?? `tel:${value.replace(/[^\d+]/g, '')}`
      const wa = toWhatsAppHref(value)
      return (
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <a href={tel} className="text-[14px] font-semibold text-[#2E2E2E] hover:text-[#8B7355]">
            {value}
          </a>
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#25D366] hover:underline">
              <FaWhatsapp size={13} aria-hidden /> WhatsApp
            </a>
          ) : null}
        </div>
      )
    }
    if (field.key === 'linkedinUrl') {
      return (
        <a href={value} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-[14px] font-semibold text-[#0A66C2] hover:underline">
          {value.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}
        </a>
      )
    }
    return <div className="mt-0.5 break-words text-[14px] font-semibold text-[#2E2E2E]">{value}</div>
  }

  return (
    <section id="profile-contact" className={`${card} scroll-mt-24`}>
      <h2 className={cardTitle}>Contact &amp; details</h2>
      <p className={cardSubtitle}>How your team and clients reach you</p>

      <div className="mt-2 divide-y divide-[#F5EFE7]">
        <Row icon={<FiMail size={15} aria-hidden />} label="Email">
          <div className="mt-0.5 flex items-center gap-2">
            <a href={`mailto:${profile.email}`} className="min-w-0 truncate text-[14px] font-semibold text-[#2E2E2E] hover:text-[#8B7355]">
              {profile.email}
            </a>
            <button type="button" className={iconBtn} onClick={() => copy('email', profile.email)} aria-label="Copy email">
              {copied === 'email' ? <FiCheck size={14} className="text-[#5B8C5A]" /> : <FiCopy size={14} />}
            </button>
          </div>
          <div className="text-[11px] text-[#8B7355]/80">Login email · managed by your admin</div>
        </Row>

        {FIELDS.map((field) => {
          const value = profile[field.key]
          const isEditing = editing === field.key
          const isBusy = busy === field.key
          const fieldError = error?.key === field.key ? error.message : null

          return (
            <Row key={field.key} icon={field.icon} label={field.label}>
              {isEditing ? (
                <form
                  className="mt-1.5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void submit(field)
                  }}
                >
                  <input
                    type={field.inputType}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={input}
                    autoFocus
                    inputMode={field.key === 'phone' ? 'tel' : undefined}
                    autoComplete={field.key === 'phone' ? 'tel' : undefined}
                    onKeyDown={(e) => e.key === 'Escape' && cancel()}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#8B7355] px-3 text-[12px] font-semibold text-white hover:bg-[#6d5a43] disabled:opacity-60"
                    >
                      <FiCheck size={13} aria-hidden /> {isBusy ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancel}
                      disabled={isBusy}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E8DCCB] px-3 text-[12px] font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7]"
                    >
                      <FiX size={13} aria-hidden /> Cancel
                    </button>
                  </div>
                </form>
              ) : value ? (
                <div className="flex items-start gap-1">
                  <div className="min-w-0 flex-1">{renderValue(field, value)}</div>
                  {field.key === 'phone' ? (
                    <button type="button" className={iconBtn} onClick={() => copy('phone', value)} aria-label="Copy contact number">
                      {copied === 'phone' ? <FiCheck size={14} className="text-[#5B8C5A]" /> : <FiCopy size={14} />}
                    </button>
                  ) : null}
                  <button type="button" className={iconBtn} onClick={() => startEdit(field.key)} disabled={isBusy} aria-label={`Edit ${field.label}`}>
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className={iconBtnDanger}
                    onClick={() => void remove(field)}
                    disabled={isBusy}
                    aria-label={`Remove ${field.label}`}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(field.key)}
                  className="mt-1 inline-flex items-center gap-1 rounded-lg border border-dashed border-[#8B7355]/40 px-2.5 py-1 text-[12px] font-semibold text-[#8B7355] hover:bg-[#F5EFE7]"
                >
                  <FiPlus size={13} aria-hidden /> Add {field.label.toLowerCase()}
                </button>
              )}
              {fieldError ? <div className="mt-1.5 text-[12px] font-medium text-[#D96B6B]">{fieldError}</div> : null}
            </Row>
          )
        })}
      </div>
    </section>
  )
}

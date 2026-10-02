import { useEffect, useRef, useState } from 'react'
import {
  FiCamera,
  FiCheck,
  FiEye,
  FiLinkedin,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShare2,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

import { resolveUploadPublicUrl } from '../../lib/crmApi'
import type { MyProfileDTO } from '../../lib/profileApi'
import { toIndiaTelHref, toWhatsAppHref } from '../../utils/phone'
import { ProfileAvatar } from './ProfileAvatar'
import { formatDate } from './shared'

const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

export type CompletenessItem = { key: string; label: string; done: boolean; targetId: string }

function CompletenessRing({ percent }: { percent: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#F5EFE7" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={percent === 100 ? '#5B8C5A' : '#8B7355'}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * percent) / 100}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  )
}

export function ProfileHero({
  profile,
  roleLabel,
  completeness,
  photoBusy,
  onPhotoSelected,
  onPhotoRemove,
  onPhotoError,
  onShareCard,
  onLogout,
}: {
  profile: MyProfileDTO
  roleLabel: string | null
  completeness: CompletenessItem[]
  photoBusy: boolean
  onPhotoSelected: (file: File) => void
  onPhotoRemove: () => void
  onPhotoError: (message: string) => void
  onShareCard: () => void
  onLogout: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!viewerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setViewerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [viewerOpen])

  const pickFile = () => {
    setMenuOpen(false)
    fileRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) {
      onPhotoError('Please choose a JPG, PNG, WebP, GIF or AVIF image')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      onPhotoError('Photo must be 5 MB or smaller')
      return
    }
    onPhotoSelected(file)
  }

  const doneCount = completeness.filter((i) => i.done).length
  const percent = completeness.length ? Math.round((doneCount / completeness.length) * 100) : 100
  const nextMissing = completeness.filter((i) => !i.done)
  const tel = profile.phone ? toIndiaTelHref(profile.phone) ?? `tel:${profile.phone.replace(/[^\d+]/g, '')}` : undefined
  const wa = profile.phone ? toWhatsAppHref(profile.phone) : undefined

  const quickAction =
    'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E8DCCB] bg-white px-4 text-[12px] font-semibold text-[#2E2E2E] transition hover:-translate-y-px hover:border-[#8B7355]/40 hover:bg-[#F5EFE7]'

  return (
    <section className="overflow-hidden rounded-3xl border border-[#8B7355]/10 bg-white shadow-[0_8px_30px_rgba(139,115,85,0.08)]">
      {/* Cover */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#2E2E2E] via-[#5C4A35] to-[#8B7355] min-[640px]:h-44">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(232,220,203,0.35) 0, transparent 40%), radial-gradient(circle at 85% 0%, rgba(245,239,231,0.25) 0, transparent 35%), radial-gradient(circle at 70% 100%, rgba(176,141,87,0.45) 0, transparent 45%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            onClick={onShareCard}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-white/15 px-3 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            <FiShare2 size={14} aria-hidden /> <span className="hidden min-[420px]:inline">Digital card</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-white/15 px-3 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            <FiLogOut size={14} aria-hidden /> <span className="hidden min-[420px]:inline">Log out</span>
          </button>
        </div>
      </div>

      <div className="relative px-5 pb-6 min-[640px]:px-8">
        <div className="flex flex-col gap-5 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div className="flex flex-col gap-4 min-[640px]:flex-row min-[640px]:items-end">
            {/* Avatar + photo menu */}
            <div className="relative -mt-14 w-fit min-[640px]:-mt-16" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                disabled={photoBusy}
                className="group relative block rounded-full ring-4 ring-white shadow-lg focus:outline-none focus-visible:ring-[#8B7355]"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Profile photo options"
              >
                <ProfileAvatar name={profile.name} url={profile.avatarUrl} size={120} />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <FiCamera size={22} aria-hidden />
                </span>
                {photoBusy ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
                  </span>
                ) : null}
              </button>
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#8B7355] text-white shadow">
                <FiCamera size={14} aria-hidden />
              </span>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-[#E8DCCB] bg-white py-1 shadow-xl"
                >
                  <button type="button" role="menuitem" onClick={pickFile} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#2E2E2E] hover:bg-[#F5EFE7]">
                    <FiUpload size={15} className="text-[#8B7355]" aria-hidden />
                    {profile.avatarUrl ? 'Change photo' : 'Upload photo'}
                  </button>
                  {profile.avatarUrl ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          setViewerOpen(true)
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#2E2E2E] hover:bg-[#F5EFE7]"
                      >
                        <FiEye size={15} className="text-[#8B7355]" aria-hidden /> View photo
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          onPhotoRemove()
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#D96B6B] hover:bg-[#FBEDED]"
                      >
                        <FiTrash2 size={15} aria-hidden /> Remove photo
                      </button>
                    </>
                  ) : null}
                  <div className="border-t border-[#F5EFE7] px-4 py-2 text-[11px] text-[#8B7355]">JPG, PNG, WebP · max 5 MB</div>
                </div>
              ) : null}
              <input ref={fileRef} type="file" accept={AVATAR_TYPES.join(',')} className="hidden" onChange={onFileChange} />
            </div>

            <div className="min-w-0 pb-1">
              <h1 className="truncate text-[24px] font-bold leading-tight text-[#2E2E2E] min-[640px]:text-[28px]">{profile.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-medium text-[#8B7355]">
                {profile.designation ? <span className="text-[#2E2E2E]">{profile.designation}</span> : null}
                {roleLabel ? (
                  <span className="inline-flex items-center rounded-full bg-[#F5EFE7] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#8B7355]">
                    {roleLabel}
                  </span>
                ) : (
                  <span className="text-[12px]">No role assigned</span>
                )}
                {profile.location ? (
                  <span className="inline-flex items-center gap-1">
                    <FiMapPin size={13} aria-hidden /> {profile.location}
                  </span>
                ) : null}
                <span className="text-[12px] text-[#8B7355]/80">Member since {formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Completeness */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#E8DCCB] bg-[#FBF8F4] p-3 pr-4 min-[900px]:max-w-[320px]">
            <div className="relative shrink-0">
              <CompletenessRing percent={percent} />
              <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[#2E2E2E]">{percent}%</span>
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-[#2E2E2E]">
                {percent === 100 ? 'Profile complete' : 'Profile strength'}
              </div>
              {percent === 100 ? (
                <div className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[#5B8C5A]">
                  <FiCheck size={13} aria-hidden /> Everything looks great
                </div>
              ) : (
                <div className="mt-1 flex flex-wrap gap-1">
                  {nextMissing.slice(0, 3).map((i) => (
                    <a
                      key={i.key}
                      href={`#${i.targetId}`}
                      onClick={(e) => {
                        if (i.key === 'photo') {
                          e.preventDefault()
                          pickFile()
                        }
                      }}
                      className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-[#8B7355] ring-1 ring-[#E8DCCB] hover:bg-[#F5EFE7]"
                    >
                      + {i.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={`mailto:${profile.email}`} className={quickAction}>
            <FiMail size={15} className="text-[#8B7355]" aria-hidden /> <span className="max-w-[220px] truncate">{profile.email}</span>
          </a>
          {profile.phone ? (
            <>
              <a href={tel} className={quickAction}>
                <FiPhone size={15} className="text-[#8B7355]" aria-hidden /> {profile.phone}
              </a>
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" className={quickAction}>
                  <FaWhatsapp size={16} className="text-[#25D366]" aria-hidden /> WhatsApp
                </a>
              ) : null}
            </>
          ) : (
            <a href="#profile-contact" className={`${quickAction} border-dashed text-[#8B7355]`}>
              <FiPhone size={15} aria-hidden /> Add contact number
            </a>
          )}
          {profile.linkedinUrl ? (
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className={quickAction}>
              <FiLinkedin size={15} className="text-[#0A66C2]" aria-hidden /> LinkedIn
            </a>
          ) : null}
        </div>
      </div>

      {viewerOpen && profile.avatarUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6" role="dialog" aria-modal="true" aria-label="Profile photo">
          <button type="button" className="absolute inset-0 cursor-zoom-out" aria-label="Close" onClick={() => setViewerOpen(false)} />
          <img
            src={resolveUploadPublicUrl(profile.avatarUrl)}
            alt={profile.name}
            className="relative max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
            aria-label="Close photo"
          >
            ×
          </button>
        </div>
      ) : null}
    </section>
  )
}

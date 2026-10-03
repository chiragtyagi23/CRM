import { useMemo, useRef, useState } from 'react'
import { QRCode } from 'react-qr-code'
import { toPng } from 'html-to-image'
import { FiCheck, FiCopy, FiDownload, FiMail, FiMapPin, FiPhone, FiUserPlus } from 'react-icons/fi'

import { Modal } from '../acl/Modal'
import type { MyProfileDTO } from '../../lib/profileApi'
import { ProfileAvatar } from './ProfileAvatar'

function vcardEscape(v: string) {
  return v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

/** vCard 3.0 — scanning the QR offers "Add contact" on iOS and Android. */
function buildVCard(p: MyProfileDTO, org: string) {
  const parts = p.name.trim().split(/\s+/)
  const last = parts.length > 1 ? parts[parts.length - 1] : ''
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : p.name
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcardEscape(last)};${vcardEscape(first)};;;`,
    `FN:${vcardEscape(p.name)}`,
    `ORG:${vcardEscape(org)}`,
    p.designation ? `TITLE:${vcardEscape(p.designation)}` : '',
    p.phone ? `TEL;TYPE=CELL:${p.phone.replace(/[^\d+]/g, '')}` : '',
    `EMAIL;TYPE=WORK:${p.email}`,
    p.location ? `ADR;TYPE=WORK:;;${vcardEscape(p.location)};;;;` : '',
    p.linkedinUrl ? `URL:${p.linkedinUrl}` : '',
    'END:VCARD',
  ]
  return lines.filter(Boolean).join('\n')
}

function fileSafe(name: string) {
  return name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'contact'
}

export function BusinessCardModal({
  open,
  onClose,
  profile,
  roleLabel,
  orgName = 'PropCRM',
}: {
  open: boolean
  onClose: () => void
  profile: MyProfileDTO
  roleLabel: string | null
  orgName?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const vcard = useMemo(() => buildVCard(profile, orgName), [profile, orgName])

  const downloadPng = async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${fileSafe(profile.name)}-card.png`
      a.click()
    } catch {
      window.alert('Could not create the image. If you have a profile photo, try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  const downloadVcf = () => {
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileSafe(profile.name)}.vcf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyDetails = () => {
    const text = [profile.name, profile.designation, profile.phone, profile.email, profile.location, profile.linkedinUrl]
      .filter(Boolean)
      .join('\n')
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  const actionBtn =
    'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E8DCCB] bg-white px-3 text-[12px] font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7] disabled:opacity-60'

  return (
    <Modal open={open} title="Digital business card" onClose={onClose}>
      <div className="flex flex-col items-center">
        <div
          ref={cardRef}
          className="relative w-full max-w-[380px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E2E2E] via-[#4A3C2C] to-[#8B7355] p-5 text-white shadow-xl"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(circle at 90% 10%, rgba(232,220,203,0.35) 0, transparent 40%), radial-gradient(circle at 0% 100%, rgba(176,141,87,0.5) 0, transparent 45%)',
            }}
          />
          <div className="relative flex items-start gap-3">
            <ProfileAvatar name={profile.name} url={profile.avatarUrl} size={56} className="ring-2 ring-white/40" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[18px] font-bold leading-tight">{profile.name}</div>
              <div className="mt-0.5 truncate text-[12px] text-white/75">
                {[profile.designation, roleLabel].filter(Boolean).join(' · ') || orgName}
              </div>
            </div>
          </div>

          <div className="relative mt-5 flex items-end justify-between gap-4">
            <ul className="min-w-0 space-y-1.5 text-[12px] text-white/90">
              {profile.phone ? (
                <li className="flex items-center gap-2">
                  <FiPhone size={12} aria-hidden /> {profile.phone}
                </li>
              ) : null}
              <li className="flex items-center gap-2">
                <FiMail size={12} aria-hidden /> <span className="truncate">{profile.email}</span>
              </li>
              {profile.location ? (
                <li className="flex items-center gap-2">
                  <FiMapPin size={12} aria-hidden /> <span className="truncate">{profile.location}</span>
                </li>
              ) : null}
              <li className="pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">{orgName}</li>
            </ul>
            <div className="shrink-0 rounded-xl bg-white p-2">
              <QRCode value={vcard} size={104} level="M" />
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[12px] text-[#8B7355]">
          Scan the QR with any phone camera to save your contact instantly.
        </p>
        {!profile.phone ? (
          <p className="mt-1 text-center text-[12px] font-medium text-[#D96B6B]">Tip: add your contact number so clients can call you.</p>
        ) : null}

        <div className="mt-4 flex w-full max-w-[380px] flex-wrap gap-2">
          <button type="button" className={actionBtn} onClick={() => void downloadPng()} disabled={busy}>
            <FiDownload size={14} aria-hidden /> {busy ? 'Preparing…' : 'Image'}
          </button>
          <button type="button" className={actionBtn} onClick={downloadVcf}>
            <FiUserPlus size={14} aria-hidden /> vCard
          </button>
          <button type="button" className={actionBtn} onClick={copyDetails}>
            {copied ? <FiCheck size={14} className="text-[#5B8C5A]" aria-hidden /> : <FiCopy size={14} aria-hidden />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

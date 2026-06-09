import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdChat } from 'react-icons/md'
import {
  FaBriefcase,
  FaCalendarDays,
  FaCircleCheck,
  FaClock,
  FaEnvelope,
  FaHouse,
  FaLocationDot,
  FaPhone,
  FaUser,
} from 'react-icons/fa6'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { submitCaptureLead } from '../store/captureLeadsSlice'
import { crmPayloadBuilder } from '../services/crmPayloadBuilder'
import {
  IconInsetField,
  SearchableSelect,
  TogglePills,
  fieldDateTimeInputClass,
  fieldInputClass,
} from '../components/uiPrimitives'
import { fetchAssignees } from '../lib/usersApi'
import { PageHeader } from '../components/PageHeader'
import { d } from '../lib/designClasses'
import { FaRupeeSign } from "react-icons/fa";
import {
  BHK_SELECT_OPTIONS,
  BUDGET_SELECT_OPTIONS,
  BUYING_STAGE_OPTIONS,
  CAPTURE_LEAD_SOURCE_TILE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  OWNERSHIP_TOGGLE_OPTIONS,
  PREFERRED_LOCATIONS,
  WORK_PROFILE_TOGGLE_OPTIONS,
  type CaptureLeadSourceId,
} from '../utils/uiConfig'

import { QRCode } from 'react-qr-code'
import { toPng } from 'html-to-image'

const fieldIconCls = 'h-[18px] w-[18px] shrink-0'

const QR_FORM_BASE_URL = (
  import.meta.env.VITE_CAMPAIGN_SITE_URL || 'http://localhost:5174'
).replace(/\/$/, '')

function buildQrFormUrl(id: string) {
  const params = new URLSearchParams({
    source: 'qrcode',
    id,
  })
  return `${QR_FORM_BASE_URL}/?${params.toString()}#contact`
}

async function downloadQrPng(node: HTMLElement) {
  const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 })
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = 'lead-enquiry-qr.png'
  link.click()
}

export function CaptureLead() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const creating = useAppSelector((s) => s.captureLeads.creating)
  const authUser = useAppSelector((s) => s.auth.user)

  const [selected, setSelected] = useState<CaptureLeadSourceId | null>(null)
  const [firstCallDate, setFirstCallDate] = useState('')
  const [callBy, setCallBy] = useState('')
  const [fullName, setFullName] = useState('')
  const [num, setNum] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [bhk, setBhk] = useState('')
  const [budget, setBudget] = useState('')
  const [resiLocation, setResiLocation] = useState('')
  const [ownership, setOwnership] = useState<'RENTED' | 'OWNED'>('RENTED')
  const [workLocation, setWorkLocation] = useState('')
  const [workProfile, setWorkProfile] = useState<'SERVICE' | 'BUSINESS'>('SERVICE')
  const [industry, setIndustry] = useState('')
  const [preferredLocations, setPreferredLocations] = useState<string[]>(['KHARGHAR'])
  const [preferredLocationOther, setPreferredLocationOther] = useState('')
  const [preferredLocationOtherSelected, setPreferredLocationOtherSelected] = useState(false)
  const [possessionBy, setPossessionBy] = useState('')
  const [leadStatus, setLeadStatus] = useState<'HOT' | 'WARM' | 'COLD'>('HOT')
  const [buyingStage, setBuyingStage] = useState<
    'SEARCHING' | 'ADVANCED' | 'SHORTLISTED' | 'TOKEN' | 'BOOKED' | 'LOST'
  >('SEARCHING')
  const [remarks, setRemarks] = useState('')
  const [callbackDate, setCallbackDate] = useState('')
  const [callbackTime, setCallbackTime] = useState('')
  const [preferredDropdownOpen, setPreferredDropdownOpen] = useState(false)
  const preferredDropdownRef = useRef<HTMLDivElement>(null)
  const [receivedByOptions, setReceivedByOptions] = useState<{ id: string; value: string; label: string }[]>([])
  const [receivedByLoading, setReceivedByLoading] = useState(true)
  const preferredLocationsLabel = useMemo(() => {
    const parts = [...preferredLocations]
    if (preferredLocationOtherSelected) {
      const custom = preferredLocationOther.trim()
      parts.push(custom || 'Other')
    }
    if (parts.length === 0) return 'Select locations'
    if (parts.length === 1) return parts[0]
    return `${parts.length} locations selected`
  }, [preferredLocations, preferredLocationOther, preferredLocationOtherSelected])

  const [showQr, setShowQr] = useState(false)
  const qrBoxRef = useRef<HTMLDivElement>(null)

  const qrUrl = useMemo(() => {
    const userId = String(authUser?.id ?? '').trim()
    if (!userId) return null
    return buildQrFormUrl(userId)
  }, [authUser?.id])

  useEffect(() => {
    if (!preferredDropdownOpen) return
    const onDoc = (e: MouseEvent) => {
      if (preferredDropdownRef.current && !preferredDropdownRef.current.contains(e.target as Node)) {
        setPreferredDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [preferredDropdownOpen])

  useEffect(() => {
    let cancelled = false
    setReceivedByLoading(true)

    fetchAssignees()
      .then((res) => {
        if (cancelled) return
        const names = (res.items ?? [])
          .map((u) => String(u.name ?? '').trim())
          .filter(Boolean)
        const me = String(authUser?.name ?? '').trim()
        if (me && !names.includes(me)) names.unshift(me)
        const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b))
        setReceivedByOptions(unique.map((name) => ({ id: name, value: name, label: name })))
      })
      .catch(() => {
        if (cancelled) return
        const me = String(authUser?.name ?? '').trim()
        setReceivedByOptions(me ? [{ id: me, value: me, label: me }] : [])
      })
      .finally(() => {
        if (!cancelled) setReceivedByLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authUser?.name])

  useEffect(() => {
    const selfName = String(authUser?.name ?? '').trim()
    if (!selfName || callBy.trim()) return
    setCallBy(selfName)
  }, [authUser?.name, callBy])

  const togglePreferredLocation = (loc: string) => {
    setPreferredLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc],
    )
  }

  const resolvedPreferredLocations = [
    ...preferredLocations,
    ...(preferredLocationOtherSelected && preferredLocationOther.trim()
      ? [preferredLocationOther.trim()]
      : []),
  ]

  const hasPreferredLocation =
    preferredLocations.length > 0 ||
    (preferredLocationOtherSelected && preferredLocationOther.trim().length > 0)

  const missingRequired = (): string[] => {
    const missing: string[] = []
    if (!firstCallDate.trim()) missing.push('1st Call Date')
    if (!callBy.trim()) missing.push('Lead Received By')
    if (!fullName.trim()) missing.push('Name')
    if (!num.trim()) missing.push('Phone Number')
    if (!callbackDate.trim()) missing.push('Callback Date')
    if (!callbackTime.trim()) missing.push('Callback Time')
    if (!hasPreferredLocation) missing.push('Preferred Location')
    if (preferredLocationOtherSelected && !preferredLocationOther.trim()) {
      missing.push('Custom Preferred Location')
    }
    return missing
  }

  const canSubmit = !creating && missingRequired().length === 0

  const handleCaptureLead = async () => {
    const missing = missingRequired()
    if (missing.length > 0) {
      alert(`Please fill required fields:\n• ${missing.join('\n• ')}`)
      return
    }

    const payload = crmPayloadBuilder.captureLead.buildCreatePayload({
      selectedSource: selected,
      firstCallDate,
      callBy,
      fullName,
      num,
      whatsapp,
      email,
      bhk,
      budget,
      resiLocation,
      ownership,
      workLocation,
      workProfile,
      industry,
      preferredLocations: resolvedPreferredLocations,
      possessionBy,
      leadStatus,
      buyingStage,
      callbackDate,
      callbackTime,
    })

    await dispatch(submitCaptureLead(payload)).unwrap()
    alert('Captured lead (saved)')
    navigate('/leads')
  }

  return (
    <section className="w-full">
      <PageHeader
        title="Add New Lead"
        subtitle="Complete the fields to capture lead information"
      />

      <div className={d.stack}>
        <section className={d.cardP6}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className={`${d.sectionTitle} mt-3 mb-0`}>LEAD SOURCE</h2>
            <button
              type="button"
              className={d.btnPrimary}
              onClick={() => {
                setSelected('qrcode')
                setShowQr(true)
              }}
            >
              Generate QR Code
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {CAPTURE_LEAD_SOURCE_TILE_OPTIONS.map((s) => {
              const active = selected === s.id
              const Icon = s.icon
              const iconToneClass =
                s.tone === 'mint'
                  ? 'text-[#6FAF8F]'
                  : s.tone === 'rose'
                    ? 'text-[#D96B6B]'
                    : s.tone === 'slate'
                      ? 'text-[#8B7355]'
                      : 'text-[#8B7355]'
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s.id)}
                  className={[
                    'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 text-sm transition-all cursor-pointer',
                    active
                      ? 'border-[#8B7355] bg-[#E8DCCB]/30 text-[#2E2E2E]'
                      : 'border-[#E8DCCB] bg-white text-[#2E2E2E] hover:border-[#8B7355]/50',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  <span className={`grid h-10 w-10 place-items-center ${iconToneClass}`}>
                    <Icon size={22} />
                  </span>
                  <span className={`text-[12px] font-semibold ${active ? 'text-[#2E2E2E]' : 'text-[#2E2E2E]'}`}>{s.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className={d.cardP6}>
          <h2 className={d.sectionTitle}>Contact Details</h2>
          <p className="mb-4 text-xs text-[#8B7355]">
            Fields marked with <span className="text-[#D96B6B]">*</span> are required to capture the lead.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IconInsetField
              label="1st CALL DATE"
              required
              dateTime
              icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}
            >
              <input
                type="date"
                value={firstCallDate}
                onChange={(e) => setFirstCallDate(e.target.value)}
                className={fieldDateTimeInputClass}
                required
                aria-required
              />
            </IconInsetField>

            <IconInsetField
              label="LEAD RECEIVED BY"
              required
              icon={<FaUser className={fieldIconCls} aria-hidden />}
            >
              <SearchableSelect
                value={callBy}
                onChange={setCallBy}
                options={receivedByOptions}
                placeholder={receivedByLoading ? 'Loading team…' : 'Select team member'}
                searchPlaceholder="Search name…"
                emptyMessage="No team members found"
                disabled={receivedByLoading}
              />
            </IconInsetField>

            <IconInsetField label="NAME" required icon={<FaUser className={fieldIconCls} aria-hidden />}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className={fieldInputClass}
                required
                aria-required
              />
            </IconInsetField>

            <IconInsetField label="NUM" required icon={<FaPhone className={fieldIconCls} aria-hidden />}>
              <input
                value={num}
                onChange={(e) => setNum(e.target.value)}
                placeholder="Phone number"
                className={fieldInputClass}
                required
                aria-required
                inputMode="tel"
              />
            </IconInsetField>

            <IconInsetField label="WHATSAPP" icon={<FaPhone className={fieldIconCls} aria-hidden />}>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp number (optional)"
                className={fieldInputClass}
                inputMode="tel"
              />
            </IconInsetField>

            <IconInsetField label="EMAIL" icon={<FaEnvelope className={fieldIconCls} aria-hidden />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className={fieldInputClass}
              />
            </IconInsetField>

          </div>
        </section>

        <section className={d.cardP6}>
          <h2 className={d.sectionTitle}>Property Requirements</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IconInsetField label="BHK" icon={<FaHouse className={fieldIconCls} aria-hidden />}>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className={`${fieldInputClass} appearance-none`}
              >
                <option value="" disabled>
                  Select BHK
                </option>
                {BHK_SELECT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </IconInsetField>

            <IconInsetField label="BGT (Budget)" icon={<FaRupeeSign className={fieldIconCls} aria-hidden />}>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={`${fieldInputClass} appearance-none`}
              >
                <option value="" disabled>
                  Select budget range
                </option>
                {BUDGET_SELECT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </IconInsetField>
          </div>
        </section>

        <section className={d.cardP6}>
          <h2 className={d.sectionTitle}>Current Residence</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IconInsetField label="RESI LOCATION" icon={<FaLocationDot className={fieldIconCls} aria-hidden />}>
              <input
                value={resiLocation}
                onChange={(e) => setResiLocation(e.target.value)}
                placeholder="Current residential location"
                className={fieldInputClass}
              />
            </IconInsetField>

            <TogglePills
              label="PROPERTY OWNERSHIP"
              value={ownership}
              options={OWNERSHIP_TOGGLE_OPTIONS}
              onChange={setOwnership}
            />
          </div>
        </section>

        <section className={d.cardP6}>
          <h2 className={d.sectionTitle}>Work Information</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IconInsetField label="WORK LOCATION" icon={<FaBriefcase className={fieldIconCls} aria-hidden />}>
              <input
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="Work location"
                className={fieldInputClass}
              />
            </IconInsetField>

            <TogglePills
              label="WORK PROFILE"
              value={workProfile}
              options={WORK_PROFILE_TOGGLE_OPTIONS}
              onChange={setWorkProfile}
            />

            <div className="min-[900px]:col-span-2">
              <IconInsetField label="TYPE OF INDUSTRY" icon={<FaBriefcase className={fieldIconCls} aria-hidden />}>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., IT Services, Manufacturing, Banking, etc."
                  className={fieldInputClass}
                />
              </IconInsetField>
            </div>
          </div>
        </section>

        <section className={d.cardP6}>
          <h2 className={d.sectionTitle}>
            Preferred Locations
          </h2>

          <div className="space-y-4">
            <IconInsetField
              label="Select one or more"
              required
              icon={<FaLocationDot className={fieldIconCls} aria-hidden />}
            >
              <div ref={preferredDropdownRef} className="relative">
                <button
                  type="button"
                  className={`${fieldInputClass} flex items-center justify-between gap-2 text-left`}
                  aria-haspopup="listbox"
                  aria-expanded={preferredDropdownOpen}
                  onClick={() => setPreferredDropdownOpen((o) => !o)}
                >
                  <span className={`min-w-0 flex-1 truncate ${preferredLocations.length > 0 || preferredLocationOtherSelected ? 'text-[#2E2E2E]' : 'text-[#8B7355]/60'}`}>
                    {preferredLocationsLabel}
                  </span>
                  <span className="shrink-0 text-[#8B7355]" aria-hidden>
                    ▾
                  </span>
                </button>

                {preferredDropdownOpen ? (
                  <div
                    className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#E8DCCB] bg-white shadow-[0_10px_24px_rgba(17,24,39,0.10)]"
                    role="listbox"
                    aria-label="Preferred locations"
                  >
                    <div className="max-h-[220px] overflow-auto p-2">
                      {PREFERRED_LOCATIONS.map((loc) => {
                        const checked = preferredLocations.includes(loc)
                        return (
                          <label
                            key={loc}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#2E2E2E] hover:bg-[#F5EFE7]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePreferredLocation(loc)}
                            />
                            <span className="min-w-0 flex-1">{loc}</span>
                          </label>
                        )
                      })}
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#2E2E2E] hover:bg-[#F5EFE7]">
                        <input
                          type="checkbox"
                          checked={preferredLocationOtherSelected}
                          onChange={() => setPreferredLocationOtherSelected((v) => !v)}
                        />
                        <span className="min-w-0 flex-1">Other (custom)</span>
                      </label>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-[#E8DCCB] bg-white px-3 py-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#8B7355] hover:text-[#2E2E2E] disabled:opacity-60"
                        disabled={
                          preferredLocations.length === 0 && !preferredLocationOtherSelected
                        }
                        onClick={() => {
                          setPreferredLocations([])
                          setPreferredLocationOtherSelected(false)
                          setPreferredLocationOther('')
                        }}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#8B7355] px-4 text-xs font-semibold text-white hover:bg-[#6d5a43]"
                        onClick={() => setPreferredDropdownOpen(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </IconInsetField>
            {preferredLocationOtherSelected ? (
              <IconInsetField
                label="Custom location"
                required
                icon={<FaLocationDot className={fieldIconCls} aria-hidden />}
              >
                <input
                  value={preferredLocationOther}
                  onChange={(e) => setPreferredLocationOther(e.target.value)}
                  placeholder="e.g., Belapur, Seawoods, Airoli…"
                  className={fieldInputClass}
                />
              </IconInsetField>
            ) : null}
          </div>
        </section>

        <section className={d.cardP6}>
          <h2 className={d.sectionTitle}>Timeline &amp; Status</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IconInsetField
              label="POSSESSION BY"
              dateTime
              icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}
            >
              <input
                type="date"
                value={possessionBy}
                onChange={(e) => setPossessionBy(e.target.value)}
                className={fieldDateTimeInputClass}
              />
            </IconInsetField>

            <div>
              <div className={d.label}>
                STATUS
              </div>
              <div className="flex gap-3">
                {LEAD_STATUS_OPTIONS.map((s) => {
                  const active = s === leadStatus
                  const activeCls =
                    s === 'HOT'
                      ? 'border-[#D96B6B] bg-[#D96B6B]/20 text-[#D96B6B]'
                      : s === 'WARM'
                        ? 'border-[#8B7355] bg-[#E8DCCB]/30 text-[#8B7355]'
                        : 'border-[#8B7355] bg-[#F5EFE7] text-[#8B7355]'
                  return (
                    <button
                      key={s}
                      type="button"
                      className={[
                        'flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                        active ? activeCls : 'border-[#E8DCCB] text-[#8B7355] hover:border-[#8B7355]/50',
                      ].join(' ')}
                      aria-pressed={active}
                      onClick={() => setLeadStatus(s)}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className={d.cardP6}>
          <h2 className={d.sectionTitle}>
            PROPERTY BUYING STAGE
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BUYING_STAGE_OPTIONS.map((s) => {
              const active = s === buyingStage
              return (
                <button
                  key={s}
                  type="button"
                  className={[
                    'rounded-lg border-2 px-4 py-3 text-sm transition-all',
                    active
                      ? 'border-[#8B7355] bg-[#E8DCCB]/30 text-[#2E2E2E] font-medium'
                      : 'border-[#E8DCCB] text-[#8B7355] hover:border-[#8B7355]/50',
                  ].join(' ')}
                  aria-pressed={active}
                  onClick={() => setBuyingStage(s)}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </section>

        <section className={d.cardP6}>
          <h2 className={d.sectionTitle}>Additional Information</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IconInsetField
              label="CB DATE (Callback Date)"
              required
              dateTime
              icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}
            >
              <input
                type="date"
                value={callbackDate}
                onChange={(e) => setCallbackDate(e.target.value)}
                className={fieldDateTimeInputClass}
                required
                aria-required
              />
            </IconInsetField>

            <IconInsetField
              label="CB TIME (Callback Time)"
              required
              dateTime
              icon={<FaClock className={fieldIconCls} aria-hidden />}
            >
              <input
                type="time"
                value={callbackTime}
                onChange={(e) => setCallbackTime(e.target.value)}
                step={60}
                className={fieldDateTimeInputClass}
                required
                aria-required
              />
            </IconInsetField>

            <label className="block min-[900px]:col-span-2">
              <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold text-[#8B7355]">
                <span className="text-[#8B7355]">
                  <MdChat className={fieldIconCls} aria-hidden />
                </span>
                REMARKS
              </div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any additional remarks or notes about the lead..."
                className="min-h-[140px] w-full resize-none rounded-lg border border-[#E8DCCB] bg-white px-4 py-2 text-sm text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none"
              />
            </label>
          </div>
        </section>

        <div className="flex gap-4">
          <button type="button" className={`flex-1 ${d.btnSecondary}`} onClick={() => window.history.back()}>
            Cancel
          </button>
          <button
            type="button"
            className={`flex-1 ${d.btnPrimary}`}
            disabled={!canSubmit}
            onClick={handleCaptureLead}
          >
            <span className="text-white/90">
              <FaCircleCheck className={fieldIconCls} aria-hidden />
            </span>
            {creating ? 'Capturing…' : 'Capture Lead'}
          </button>
        </div>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowQr(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[#E8DCCB] bg-white p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-[#2E2E2E]">Scan to open enquiry form</p>
            <p className="mt-1 text-xs text-[#8B7355]">Point your phone camera at the code below</p>
            {qrUrl ? (
              <>
                <div ref={qrBoxRef} className="mx-auto mt-5 inline-block rounded-lg border border-[#E8DCCB] bg-white p-3">
                  <QRCode value={qrUrl} size={200} level="M" />
                </div>
                <p className="mt-4 break-all text-[10px] leading-relaxed text-[#8B7355]">{qrUrl}</p>
              </>
            ) : (
              <p className="mt-5 text-sm text-[#D96B6B]">
                Could not build QR link — sign in again to include your user id.
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className={`flex-1 ${d.btnSecondary}`}
                disabled={!qrUrl}
                onClick={() => {
                  if (qrBoxRef.current) void downloadQrPng(qrBoxRef.current)
                }}
              >
                Download QR
              </button>
              <button type="button" className={`flex-1 ${d.btnPrimary}`} onClick={() => setShowQr(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}


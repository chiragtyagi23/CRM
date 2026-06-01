import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdChat } from 'react-icons/md'
import {
  FaBriefcase,
  FaCalendarDays,
  FaCircleCheck,
  FaClock,
  FaDollarSign,
  FaEnvelope,
  FaHouse,
  FaLocationDot,
  FaPhone,
  FaUser,
} from 'react-icons/fa6'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { submitCaptureLead } from '../store/captureLeadsSlice'
import { fetchUsers, type CrmUserDTO } from '../lib/usersApi'
import { crmPayloadBuilder } from '../services/crmPayloadBuilder'
import { IconInsetField, TogglePills, fieldInputClass } from '../components/uiPrimitives'
import { PageHeader } from '../components/PageHeader'
import { d } from '../lib/designClasses'
import {
  BHK_SELECT_OPTIONS,
  BUDGET_SELECT_OPTIONS,
  BUYING_STAGE_OPTIONS,
  CAPTURE_LEAD_SOURCE_TILE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  OWNERSHIP_TOGGLE_OPTIONS,
  PREFERRED_LOCATION_OTHER_VALUE,
  PREFERRED_LOCATIONS,
  WORK_PROFILE_TOGGLE_OPTIONS,
  type CaptureLeadSourceId,
} from '../utils/uiConfig'

const fieldIconCls = 'h-[18px] w-[18px] shrink-0'

export function CaptureLead() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const creating = useAppSelector((s) => s.captureLeads.creating)
  const token = useAppSelector((s) => s.auth.token)

  const [selected, setSelected] = useState<CaptureLeadSourceId | null>(null)
  const [firstCallDate, setFirstCallDate] = useState('')
  const [callBy, setCallBy] = useState('')
  const [teamMembers, setTeamMembers] = useState<CrmUserDTO[]>([])
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
  const [preferredLocation, setPreferredLocation] = useState('KHARGHAR')
  const [preferredLocationOther, setPreferredLocationOther] = useState('')
  const [possessionBy, setPossessionBy] = useState('')
  const [leadStatus, setLeadStatus] = useState<'HOT' | 'WARM' | 'COLD'>('HOT')
  const [buyingStage, setBuyingStage] = useState<
    'SEARCHING' | 'ADVANCED' | 'SHORTLISTED' | 'TOKEN' | 'BOOKED' | 'LOST'
  >('SEARCHING')
  const [remarks, setRemarks] = useState('')
  const [callbackDate, setCallbackDate] = useState('')
  const [callbackTime, setCallbackTime] = useState('')

  useEffect(() => {
    if (!token) return
    fetchUsers()
      .then((res) => {
        setTeamMembers(res.items ?? [])
        setCallBy((prev) => {
          if (prev.trim()) return prev
          const first = res.items?.[0]?.name
          return first ? String(first) : ''
        })
      })
      .catch(() => {
        setTeamMembers([])
      })
  }, [token])

  const handleCaptureLead = async () => {
    const preferredResolved =
      preferredLocation === PREFERRED_LOCATION_OTHER_VALUE
        ? preferredLocationOther.trim()
        : preferredLocation
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
      preferredResolved,
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
        subtitle="Complete all required fields to capture lead information"
      />

      <div className={d.stack}>
      <section className={d.cardP6}>
        <h2 className={d.sectionTitle}>
          SOURCE <span className="text-[#D96B6B]">*</span>
        </h2>

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <IconInsetField label="1st CALL DATE" required icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}>
            <input
              value={firstCallDate}
              onChange={(e) => setFirstCallDate(e.target.value)}
              className={fieldInputClass}
            />
          </IconInsetField>

          <IconInsetField label="CALL BY" required icon={<FaUser className={fieldIconCls} aria-hidden />}>
            <select
              value={callBy}
              onChange={(e) => setCallBy(e.target.value)}
              className={`${fieldInputClass} appearance-none`}
            >
              <option value="" disabled>
                Select team member
              </option>
              {teamMembers.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </IconInsetField>

          <IconInsetField label="NAME" required icon={<FaUser className={fieldIconCls} aria-hidden />}>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className={fieldInputClass}
            />
          </IconInsetField>

          <IconInsetField label="NUM" required icon={<FaPhone className={fieldIconCls} aria-hidden />}>
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              className={fieldInputClass}
            />
          </IconInsetField>

          <IconInsetField label="WHATSAPP" required icon={<FaPhone className={fieldIconCls} aria-hidden />}>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className={fieldInputClass}
            />
          </IconInsetField>

          <IconInsetField label="EMAIL" required icon={<FaEnvelope className={fieldIconCls} aria-hidden />}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldInputClass}
            />
          </IconInsetField>
        </div>
      </section>

      <section className={d.cardP6}>
        <h2 className={d.sectionTitle}>Property Requirements</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <IconInsetField label="BHK" required icon={<FaHouse className={fieldIconCls} aria-hidden />}>
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

          <IconInsetField label="BGT (Budget)" required icon={<FaDollarSign className={fieldIconCls} aria-hidden />}>
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
          <IconInsetField label="RESI Location" required icon={<FaLocationDot className={fieldIconCls} aria-hidden />}>
            <input
              value={resiLocation}
              onChange={(e) => setResiLocation(e.target.value)}
              placeholder="Current residential location"
              className={fieldInputClass}
            />
          </IconInsetField>

          <TogglePills
            label="PROPERTY OWNERSHIP"
            required
            value={ownership}
            options={OWNERSHIP_TOGGLE_OPTIONS}
            onChange={setOwnership}
          />
        </div>
      </section>

      <section className={d.cardP6}>
        <h2 className={d.sectionTitle}>Work Information</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <IconInsetField label="WORK Location" required icon={<FaBriefcase className={fieldIconCls} aria-hidden />}>
            <input
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="Work location"
              className={fieldInputClass}
            />
          </IconInsetField>

          <TogglePills
            label="WORK PROFILE"
            required
            value={workProfile}
            options={WORK_PROFILE_TOGGLE_OPTIONS}
            onChange={setWorkProfile}
          />

          <div className="min-[900px]:col-span-2">
            <IconInsetField label="TYPE OF INDUSTRY" required icon={<FaBriefcase className={fieldIconCls} aria-hidden />}>
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
          Preferred Locations <span className="text-[#D96B6B]">*</span>
        </h2>

        <div className="space-y-4">
          <IconInsetField label="Preferred Location" required icon={<FaLocationDot className={fieldIconCls} aria-hidden />}>
            <select
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              className={`${fieldInputClass} appearance-none`}
            >
              {PREFERRED_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value={PREFERRED_LOCATION_OTHER_VALUE}>Other (custom)</option>
            </select>
          </IconInsetField>
          {preferredLocation === PREFERRED_LOCATION_OTHER_VALUE ? (
            <IconInsetField label="Custom location" required icon={<FaLocationDot className={fieldIconCls} aria-hidden />}>
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
          <IconInsetField label="POSSESSION BY" required icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}>
            <input
              value={possessionBy}
              onChange={(e) => setPossessionBy(e.target.value)}
              placeholder="e.g., Dec 2026"
              className={fieldInputClass}
            />
          </IconInsetField>

          <div>
            <div className={d.label}>
              STATUS <span className="text-[#D96B6B]">*</span>
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
          PROPERTY BUYING STAGE <span className="text-[#D96B6B]">*</span>
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
          <label className="block min-[900px]:col-span-2">
            <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold text-[#8B7355]">
              <span className="text-[#8B7355]">
                <MdChat className={fieldIconCls} aria-hidden />
              </span>
              REMARKS <span className="text-[#D96B6B]">*</span>
            </div>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional remarks or notes about the lead..."
              className="min-h-[140px] w-full resize-none rounded-lg border border-[#E8DCCB] bg-white px-4 py-2 text-sm text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none"
            />
          </label>

          <IconInsetField label="CB DATE (Callback Date)" required icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}>
            <input
              value={callbackDate}
              onChange={(e) => setCallbackDate(e.target.value)}
              placeholder="dd-mm-yyyy or yyyy-mm-dd"
              className={fieldInputClass}
            />
          </IconInsetField>

          <IconInsetField label="CB TIME (Callback Time)" required icon={<FaClock className={fieldIconCls} aria-hidden />}>
            <input
              type="time"
              value={callbackTime}
              onChange={(e) => setCallbackTime(e.target.value)}
              className={fieldInputClass}
            />
          </IconInsetField>
        </div>
      </section>

      <div className="flex gap-4">
        <button type="button" className={`flex-1 ${d.btnSecondary}`} onClick={() => window.history.back()}>
          Cancel
        </button>
        <button
          type="button"
          className={`flex-1 ${d.btnPrimary}`}
          disabled={
            creating ||
            !fullName.trim() ||
            !num.trim() ||
            !callbackDate.trim() ||
            !callbackTime.trim() ||
            (preferredLocation === PREFERRED_LOCATION_OTHER_VALUE && !preferredLocationOther.trim())
          }
          onClick={handleCaptureLead}
        >
          <span className="text-white/90">
            <FaCircleCheck className={fieldIconCls} aria-hidden />
          </span>
          {creating ? 'Capturing…' : 'Capture Lead'}
        </button>
      </div>
      </div>
    </section>
  )
}


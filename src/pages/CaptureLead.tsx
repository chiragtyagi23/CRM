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
import { IconInsetField, TogglePills } from '../components/uiPrimitives'
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
    <section className="mx-auto box-border w-full max-w-[980px]">
      <header className="py-2 pb-4">
        <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] text-gray-900">Add New Lead</h2>
        <p className="mt-1 text-[14px] font-medium text-gray-500">Complete all required fields to capture lead information</p>
      </header>

      <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[12px] font-semibold tracking-[0.02em] text-gray-800">
          SOURCE <span className="text-rose-500">*</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 min-[760px]:grid-cols-4">
          {CAPTURE_LEAD_SOURCE_TILE_OPTIONS.map((s) => {
            const active = selected === s.id
            const Icon = s.icon
            const iconToneClass =
              s.tone === 'mint'
                ? 'text-emerald-600'
                : s.tone === 'rose'
                  ? 'text-rose-600'
                  : s.tone === 'slate'
                    ? 'text-slate-600'
                    : 'text-[#80654a]'
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s.id)}
                className={[
                  'flex h-[86px] flex-col items-center justify-center gap-2 rounded-xl border px-5 text-[12px] font-semibold transition-colors cursor-pointer',
                  active
                    ? 'border-[#80654a] bg-[#faf6ef] text-gray-900 shadow-[inset_0_0_0_2px_rgba(128,101,74,0.2)]'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50',
                ].join(' ')}
                aria-pressed={active}
              >
                <span className={`grid h-10 w-10 place-items-center ${iconToneClass}`}>
                  <Icon size={22} />
                </span>
                <span className={`text-[12px] font-semibold ${active ? 'text-gray-900' : 'text-gray-700'}`}>{s.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Contact Details</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <IconInsetField label="1st CALL DATE" required icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}>
            <input
              value={firstCallDate}
              onChange={(e) => setFirstCallDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </IconInsetField>

          <IconInsetField label="CALL BY" required icon={<FaUser className={fieldIconCls} aria-hidden />}>
            <select
              value={callBy}
              onChange={(e) => setCallBy(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
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
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </IconInsetField>

          <IconInsetField label="NUM" required icon={<FaPhone className={fieldIconCls} aria-hidden />}>
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </IconInsetField>

          <IconInsetField label="WHATSAPP" required icon={<FaPhone className={fieldIconCls} aria-hidden />}>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </IconInsetField>

          <IconInsetField label="EMAIL" required icon={<FaEnvelope className={fieldIconCls} aria-hidden />}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </IconInsetField>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Property Requirements</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <IconInsetField label="BHK" required icon={<FaHouse className={fieldIconCls} aria-hidden />}>
            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
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
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
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

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Current Residence</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <IconInsetField label="RESI Location" required icon={<FaLocationDot className={fieldIconCls} aria-hidden />}>
            <input
              value={resiLocation}
              onChange={(e) => setResiLocation(e.target.value)}
              placeholder="Current residential location"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
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

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Work Information</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <IconInsetField label="WORK Location" required icon={<FaBriefcase className={fieldIconCls} aria-hidden />}>
            <input
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="Work location"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
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
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </IconInsetField>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-800">
          Preferred Locations <span className="text-rose-500">*</span>
        </div>

        <div className="mt-5 space-y-4">
          <IconInsetField label="Preferred Location" required icon={<FaLocationDot className={fieldIconCls} aria-hidden />}>
            <select
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
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
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </IconInsetField>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Timeline &amp; Status</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <IconInsetField label="POSSESSION BY" required icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}>
            <input
              value={possessionBy}
              onChange={(e) => setPossessionBy(e.target.value)}
              placeholder="e.g., Dec 2026"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </IconInsetField>

          <div>
            <div className="mb-2 text-[11px] font-semibold text-gray-500">
              STATUS <span className="text-rose-500">*</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {LEAD_STATUS_OPTIONS.map((s) => {
                const active = s === leadStatus
                const activeCls =
                  s === 'HOT'
                    ? 'border-rose-300 bg-rose-100 text-rose-700'
                    : s === 'WARM'
                      ? 'border-[#cdb89f] bg-[#faf6ef] text-[#80654a]'
                      : 'border-gray-300 bg-white text-gray-600'
                return (
                  <button
                    key={s}
                    type="button"
                    className={[
                      'h-11 rounded-xl border text-[12px] font-semibold tracking-wide',
                      active ? activeCls : 'border-gray-200 bg-white text-gray-600',
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

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[12px] font-semibold tracking-[0.02em] text-gray-800">
          PROPERTY BUYING STAGE <span className="text-rose-500">*</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 min-[760px]:grid-cols-3">
          {BUYING_STAGE_OPTIONS.map((s) => {
            const active = s === buyingStage
            return (
              <button
                key={s}
                type="button"
                className={[
                  'h-11 rounded-xl border px-3 text-[12px] font-semibold tracking-wide',
                  active ? 'border-[#cdb89f] bg-[#faf6ef] text-[#80654a]' : 'border-gray-200 bg-white text-gray-600',
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

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Additional Information</div>

        <div className="mt-5 grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
          <label className="block min-[900px]:col-span-2">
            <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold text-gray-500">
              <span className="text-gray-400">
                <MdChat className={fieldIconCls} aria-hidden />
              </span>
              REMARKS <span className="text-rose-500">*</span>
            </div>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional remarks or notes about the lead..."
              className="min-h-[140px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </label>

          <IconInsetField label="CB DATE (Callback Date)" required icon={<FaCalendarDays className={fieldIconCls} aria-hidden />}>
            <input
              value={callbackDate}
              onChange={(e) => setCallbackDate(e.target.value)}
              placeholder="dd-mm-yyyy or yyyy-mm-dd"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </IconInsetField>

          <IconInsetField label="CB TIME (Callback Time)" required icon={<FaClock className={fieldIconCls} aria-hidden />}>
            <input
              type="time"
              value={callbackTime}
              onChange={(e) => setCallbackTime(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
            />
          </IconInsetField>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 min-[760px]:grid-cols-2">
        <button
          type="button"
          className="h-12 w-full rounded-2xl border border-[#e7ddcf] bg-[#faf6ef] text-[13px] font-semibold text-gray-700 hover:bg-[#f6f0e6]"
          onClick={() => {
            window.history.back()
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#80654a] text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940]"
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


import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { FaFacebook, FaGlobe, FaQrcode } from 'react-icons/fa'
import { FaBookmark, FaHouse } from 'react-icons/fa6'
import { MdPeopleAlt } from 'react-icons/md'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { submitCaptureLead } from '../store/captureLeadsSlice'
import { fetchUsers, type CrmUserDTO } from '../lib/usersApi'


type SourceId = '99acres' | 'magicbricks' | 'housing' | 'facebook' | 'website' | 'qrcode' | 'walkin'

type SourceOption = {
  id: SourceId
  label: string
  icon: React.ReactNode
}

function TileIcon({ children, tone }: { children: React.ReactNode; tone: 'sand' | 'mint' | 'slate' | 'rose' }) {
  const cls =
    tone === 'mint'
      ? 'text-emerald-600'
      : tone === 'rose'
        ? 'text-rose-600'
        : tone === 'slate'
          ? 'text-slate-600'
          : 'text-[#80654a]'
  return <span className={`grid h-10 w-10 place-items-center ${cls}`}>{children}</span>
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M5.25 2.5a.75.75 0 0 1 .75.75V4h6v-.75a.75.75 0 0 1 1.5 0V4h.75A1.75 1.75 0 0 1 16 5.75v8.5A1.75 1.75 0 0 1 14.25 16H3.75A1.75 1.75 0 0 1 2 14.25v-8.5A1.75 1.75 0 0 1 3.75 4h.75v-.75a.75.75 0 0 1 .75-.75zM3.5 7v7.25c0 .14.11.25.25.25h10.5a.25.25 0 0 0 .25-.25V7h-11z"
      />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.5a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5zM4 15.5c0-2.9 2.24-5.25 5-5.25s5 2.35 5 5.25V16H4v-.5z"
      />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M5.45 2.25h2.05c.38 0 .7.27.76.64l.38 2.3c.06.37-.16.73-.52.84l-1.56.5c.37.87.98 1.82 1.76 2.6.78.78 1.73 1.39 2.6 1.76l.5-1.56c.11-.36.47-.58.84-.52l2.3.38c.37.06.64.38.64.76v2.05c0 .42-.32.76-.74.8-1.2.1-3.64-.02-6.22-2.6-2.58-2.58-2.7-5.02-2.6-6.22.04-.42.38-.74.8-.74z"
      />
    </svg>
  )
}

function IconHomeSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.75 2.5 8v7.25c0 .41.34.75.75.75H7V11h4v5h3.75c.41 0 .75-.34.75-.75V8L9 2.75z"
      />
    </svg>
  )
}

function IconDollar() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9.75 2.5a.75.75 0 0 0-1.5 0v.84c-1.72.2-3 1.26-3 2.86 0 1.65 1.36 2.38 3.4 2.86 1.78.41 2.1.84 2.1 1.55 0 .8-.78 1.34-2 1.34-1.09 0-1.95-.33-2.62-1a.75.75 0 1 0-1.06 1.06c.8.8 1.86 1.25 3.18 1.38v.85a.75.75 0 0 0 1.5 0v-.88c1.78-.25 3-1.37 3-3 0-1.78-1.43-2.53-3.5-3-1.7-.4-2-.76-2-1.42 0-.66.67-1.19 1.75-1.19.97 0 1.7.25 2.25.8a.75.75 0 0 0 1.06-1.06c-.72-.72-1.68-1.12-2.81-1.25V2.5z"
      />
    </svg>
  )
}

function IconRemarks() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M3.75 3h10.5c.41 0 .75.34.75.75v7.5c0 .41-.34.75-.75.75H7.2l-2.6 2.2c-.49.42-1.1.08-1.1-.55V12h-.75c-.41 0-.75-.34-.75-.75v-7.5c0-.41.34-.75.75-.75zm1.5 3h7.5a.75.75 0 0 0 0-1.5h-7.5a.75.75 0 0 0 0 1.5zm0 3h7.5a.75.75 0 0 0 0-1.5h-7.5a.75.75 0 0 0 0 1.5z"
      />
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.25A6.75 6.75 0 1 0 9 15.75 6.75 6.75 0 0 0 9 2.25zm3.15 5.2a.75.75 0 0 1 0 1.06L8.8 11.86a.75.75 0 0 1-1.06 0L5.85 9.97a.75.75 0 0 1 1.06-1.06l1.36 1.36 2.82-2.82a.75.75 0 0 1 1.06 0z"
      />
    </svg>
  )
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string
  required?: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-semibold text-gray-500">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        {children}
      </div>
    </label>
  )
}

function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.25a4.25 4.25 0 0 0-4.25 4.15c0 3.2 3.5 7.85 4.25 8.85.75-1 4.25-5.65 4.25-8.85A4.25 4.25 0 0 0 9 2.25zm0 5.5a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7z"
      />
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M6.25 3.5c0-.69.56-1.25 1.25-1.25h3c.69 0 1.25.56 1.25 1.25V5h2A1.75 1.75 0 0 1 15.5 6.75v1.6a3 3 0 0 1-1.25.85v-.95h-2.5v1.1H6.25v-1.1h-2.5v.95A3 3 0 0 1 2.5 8.35v-1.6A1.75 1.75 0 0 1 4.25 5h2V3.5zm1.5.25V5h2.5V3.75h-2.5zM3.75 10.2v3.05c0 .41.34.75.75.75h9c.41 0 .75-.34.75-.75V10.2c-.24.06-.49.1-.75.1h-2.75v1.1h-3.5v-1.1H4.5c-.26 0-.51-.04-.75-.1z"
      />
    </svg>
  )
}

function TogglePills<T extends string>({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string
  required?: boolean
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold text-gray-500">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={[
                'h-11 rounded-xl border text-[12px] font-semibold tracking-wide',
                active ? 'border-[#cdb89f] bg-[#faf6ef] text-[#80654a]' : 'border-gray-200 bg-white text-gray-600',
              ].join(' ')}
              aria-pressed={active}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CaptureLead() {
  const dispatch = useAppDispatch()
  const creating = useAppSelector((s) => s.captureLeads.creating)
  const token = useAppSelector((s) => s.auth.token)

  const allPreferredLocations = useMemo(
    () => ['KHARGHAR', 'UPPER KHARGHAR', 'NERUL', 'TALOJA', 'PANVEL', 'KARJAT', 'VASHI', 'GHANSOLI'],
    [],
  )

  const [selected, setSelected] = useState<SourceId | null>(null)
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
  const [possessionBy, setPossessionBy] = useState('')
  const [leadStatus, setLeadStatus] = useState<'HOT' | 'WARM' | 'COLD'>('HOT')
  const [buyingStage, setBuyingStage] = useState<
    'SEARCHING' | 'ADVANCED' | 'SHORTLISTED' | 'TOKEN' | 'BOOKED' | 'LOST'
  >('SEARCHING')
  const [remarks, setRemarks] = useState('')
  const [callbackDate, setCallbackDate] = useState('')

  useEffect(() => {
    if (!token) return
    fetchUsers({ role: 'user' })
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

  const sources = useMemo<SourceOption[]>(
    () => [
      { id: '99acres', label: '99acres', icon: <TileIcon tone="sand"><FaGlobe size={22} /></TileIcon> },
      { id: 'magicbricks', label: 'MagicBricks', icon: <TileIcon tone="mint"><FaBookmark size={22} /></TileIcon> },
      { id: 'housing', label: 'Housing.com', icon: <TileIcon tone="slate"><FaHouse size={22} /></TileIcon> },
      { id: 'facebook', label: 'Facebook', icon: <TileIcon tone="sand"><FaFacebook size={22} /></TileIcon> },
      { id: 'website', label: 'Website', icon: <TileIcon tone="mint"><FaGlobe size={22} /></TileIcon> },
      { id: 'qrcode', label: 'QR Code', icon: <TileIcon tone="rose"><FaQrcode size={22} /></TileIcon> },
      { id: 'walkin', label: 'Walk-in', icon: <TileIcon tone="slate"><MdPeopleAlt size={22} /></TileIcon> },
    ],
    [],
  )

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
          {sources.map((s) => {
            const active = selected === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s.id)}
                className={[
                  'flex h-[86px] flex-col items-center justify-center gap-2 rounded-xl border bg-white px-5 text-[12px] font-semibold text-gray-800',
                  'border-gray-200 hover:bg-gray-50',
                  active ? 'bg-[#fab969]' : '',
                ].join(' ')}
                aria-pressed={active}
              >
                {s.icon}
                <span className="text-[12px] font-semibold text-gray-700">{s.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Contact Details</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <Field label="1st CALL DATE" required icon={<IconCalendar />}>
            <input
              value={firstCallDate}
              onChange={(e) => setFirstCallDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>

          <Field label="CALL BY" required icon={<IconUser />}>
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
          </Field>

          <Field label="NAME" required icon={<IconUser />}>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>

          <Field label="NUM" required icon={<IconPhone />}>
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>

          <Field label="WHATSAPP" required icon={<IconPhone />}>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>

          <Field label="EMAIL" required icon={<IconPhone />}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Property Requirements</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <Field label="BHK" required icon={<IconHomeSmall />}>
            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
            >
              <option value="" disabled>
                Select BHK
              </option>
              <option value="1 BHK">1 BHK</option>
              <option value="2 BHK">2 BHK</option>
              <option value="3 BHK">3 BHK</option>
              <option value="4 BHK">4 BHK</option>
            </select>
          </Field>

          <Field label="BGT (Budget)" required icon={<IconDollar />}>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
            >
              <option value="" disabled>
                Select budget range
              </option>
              <option value="45-55 Lakhs">45-55 Lakhs</option>
              <option value="65-75 Lakhs">65-75 Lakhs</option>
              <option value="75-85 Lakhs">75-85 Lakhs</option>
              <option value="90 Lakhs - 1 Cr">90 Lakhs - 1 Cr</option>
              <option value="1-1.2 Crores">1-1.2 Crores</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Current Residence</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <Field label="RESI Location" required icon={<IconPin />}>
            <input
              value={resiLocation}
              onChange={(e) => setResiLocation(e.target.value)}
              placeholder="Current residential location"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>

          <TogglePills
            label="PROPERTY OWNERSHIP"
            required
            value={ownership}
            options={[
              { value: 'RENTED', label: 'RENTED' },
              { value: 'OWNED', label: 'OWNED' },
            ]}
            onChange={setOwnership}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Work Information</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <Field label="WORK Location" required icon={<IconBriefcase />}>
            <input
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="Work location"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>

          <TogglePills
            label="WORK PROFILE"
            required
            value={workProfile}
            options={[
              { value: 'SERVICE', label: 'SERVICE' },
              { value: 'BUSINESS', label: 'BUSINESS' },
            ]}
            onChange={setWorkProfile}
          />

          <div className="min-[900px]:col-span-2">
            <Field label="TYPE OF INDUSTRY" required icon={<IconBriefcase />}>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., IT Services, Manufacturing, Banking, etc."
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[12px] font-semibold tracking-[0.02em] text-gray-800">
          PREFERRED LOCATIONS <span className="text-rose-500">*</span>
        </div>

        <div className="mt-5">
          <Field label="Preferred Location" required icon={<IconPin />}>
            <select
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
            >
              {allPreferredLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-900/5 bg-white p-5 sm:p-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="text-[18px] font-bold text-gray-900">Timeline &amp; Status</div>

        <div className="mt-5 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
          <Field label="POSSESSION BY" required icon={<IconCalendar />}>
            <input
              value={possessionBy}
              onChange={(e) => setPossessionBy(e.target.value)}
              placeholder="e.g., Dec 2026"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>

          <div>
            <div className="mb-2 text-[11px] font-semibold text-gray-500">
              STATUS <span className="text-rose-500">*</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(['HOT', 'WARM', 'COLD'] as const).map((s) => {
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
          {(['SEARCHING', 'ADVANCED', 'SHORTLISTED', 'TOKEN', 'BOOKED', 'LOST'] as const).map((s) => {
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

        <div className="mt-5 grid grid-cols-1 gap-6">
          <label className="block">
            <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold text-gray-500">
              <span className="text-gray-400">
                <IconRemarks />
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

          <Field label="CB DATE (Callback Date)" required icon={<IconCalendar />}>
            <input
              value={callbackDate}
              onChange={(e) => setCallbackDate(e.target.value)}
              placeholder="dd-mm-yyyy --:--"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
            />
          </Field>
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
          disabled={creating || !fullName.trim() || !num.trim()}
          onClick={async () => {
            const payload = {
              source: selected,
              firstCallDate: firstCallDate || null,
              callBy: callBy || null,
              name: fullName,
              number: num,
              whatsappNumber: whatsapp || null,
              email: email || null,
              bhk: bhk || null,
              budget: budget || null,
              resiLocation: resiLocation || null,
              propertyOwnership: ownership,
              workLocation: workLocation || null,
              workProfile,
              industryType: industry || null,
              preferredLocation: preferredLocation ? [preferredLocation] : [],
              possessionDate: possessionBy || null,
              status: leadStatus,
              propertyBuyingStage: buyingStage,
              callbackDate: callbackDate || null,
            }

            await dispatch(submitCaptureLead(payload)).unwrap()
            alert('Captured lead (saved)')
            window.location.hash = '#leads'
          }}
        >
          <span className="text-white/90">
            <IconCheckCircle />
          </span>
          {creating ? 'Capturing…' : 'Capture Lead'}
        </button>
      </div>
      </div>
    </section>
  )
}


import { useEffect, useMemo, useState } from 'react'

import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { fetchCaptureLeads, type CaptureLeadDTO } from '../../lib/captureLeadsApi'
import {
  whatsappApi,
  type WaBroadcastParams,
  type WaContactRecipients,
  type WaLeadField,
  type WaParamSource,
  type WaTemplate,
} from '../../lib/whatsappApi'
import { describeInputs, LEAD_FIELD_OPTIONS } from '../../lib/whatsappTemplates'
import { CAPTURE_LEAD_SOURCE_TILE_OPTIONS } from '../../utils/uiConfig'
import { Field, Notice, TemplatePreview } from './shared'

type VarSpec = { mode: 'static' | 'lead'; value: string; field: WaLeadField; fallback: string }
type RecipientMode = 'contacts' | 'filter' | 'pick' | 'phones'
/** Minimal recipient shape for the preview: a lead, or a contact mapped to name/number. */
type SampleRecipient = Record<string, unknown>

const MAX_RECIPIENTS = 1000
const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'OPPORTUNITY', 'SITE VISIT']
const SCORES = ['HOT', 'WARM', 'COLD']

const emptySpec = (): VarSpec => ({ mode: 'lead', value: '', field: 'name', fallback: '' })

function toSource(s: VarSpec): WaParamSource {
  return s.mode === 'lead' ? { source: 'lead', field: s.field, fallback: s.fallback || undefined } : { source: 'static', value: s.value }
}

function sampleValue(s: VarSpec, sample: SampleRecipient | undefined) {
  if (s.mode === 'static') return s.value
  const v = sample ? String(sample[s.field] ?? '').trim() : ''
  return v || s.fallback || `‹${LEAD_FIELD_OPTIONS.find((o) => o.value === s.field)?.label}›`
}

function VarRow({ label, spec, onChange }: { label: string; spec: VarSpec; onChange: (s: VarSpec) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg bg-[#FAF7F2] p-3 sm:grid-cols-[110px_120px_minmax(0,1fr)]">
      <span className="self-center text-sm font-medium text-[#2E2E2E]">{label}</span>
      <select className={d.select} value={spec.mode} onChange={(e) => onChange({ ...spec, mode: e.target.value as VarSpec['mode'] })} aria-label={`${label} source`}>
        <option value="lead">Lead field</option>
        <option value="static">Fixed text</option>
      </select>
      {spec.mode === 'static' ? (
        <input className={d.input} value={spec.value} onChange={(e) => onChange({ ...spec, value: e.target.value })} placeholder="Same value for everyone" />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <select className={d.select} value={spec.field} onChange={(e) => onChange({ ...spec, field: e.target.value as WaLeadField })} aria-label={`${label} lead field`}>
            {LEAD_FIELD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input className={d.input} value={spec.fallback} onChange={(e) => onChange({ ...spec, fallback: e.target.value })} placeholder="If empty…" />
        </div>
      )}
    </div>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
  /** Preset audience from the Contacts tab (selection, a tag, or everyone). */
  initialContacts?: { recipients: WaContactRecipients; label: string }
}

export function NewBroadcastModal(props: Props) {
  // Mounted only while open, so every open starts from fresh state.
  return props.open ? <NewBroadcastForm {...props} /> : null
}

function NewBroadcastForm({ onClose, onCreated, initialContacts }: Props) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<WaTemplate[]>([])
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  /** Keyed `h:<var>`, `b:<var>`, `btn:<index>`; missing keys fall back to defaults. */
  const [specs, setSpecs] = useState<Record<string, VarSpec>>({})
  const [mediaLink, setMediaLink] = useState('')
  const [mode, setMode] = useState<RecipientMode>('contacts')
  const [contactScope, setContactScope] = useState<WaContactRecipients>(initialContacts?.recipients ?? { all: true })
  const [contactTags, setContactTags] = useState<{ tag: string; count: number }[]>([])
  const [contactPreview, setContactPreview] = useState<{ total: number; sample?: SampleRecipient } | null>(null)
  const [filter, setFilter] = useState({ status: 'all', score: 'all', source: 'all', q: '' })
  const [matches, setMatches] = useState<{ items: CaptureLeadDTO[]; total: number } | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [phones, setPhones] = useState('')
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    whatsappApi
      .templates({ status: 'APPROVED' })
      .then(setTemplates)
      .catch((err) => setError(getApiErrorMessage(err)))
  }, [])

  const template = templates.find((t) => t.id === templateId)
  const inputs = useMemo(() => (template ? describeInputs(template) : null), [template])
  const specFor = (key: string, fallback: VarSpec = emptySpec()) => specs[key] ?? fallback
  const staticSpec: VarSpec = { ...emptySpec(), mode: 'static' }
  const header = (inputs?.headerVariables ?? []).map((n) => specFor(`h:${n}`))
  const body = (inputs?.bodyVariables ?? []).map((n) => specFor(`b:${n}`))
  const buttons = Object.fromEntries((inputs?.buttonInputs ?? []).map((b) => [String(b.index), specFor(`btn:${b.index}`, staticSpec)]))
  const setSpec = (key: string, spec: VarSpec) => setSpecs((prev) => ({ ...prev, [key]: spec }))

  useEffect(() => {
    whatsappApi
      .contactTags()
      .then(setContactTags)
      .catch(() => setContactTags([]))
  }, [])

  // Audience size + a sample recipient for the preview. Tag unions are estimated from per-tag counts.
  useEffect(() => {
    if (mode !== 'contacts') return
    const ids = contactScope.ids ?? []
    const tag = contactScope.tags?.[0]
    const t = window.setTimeout(() => {
      whatsappApi
        .contacts({ tag: contactScope.all || ids.length ? undefined : tag, consent: 'reachable', limit: 1 })
        .then((r) => {
          const c = r.items[0]
          const sample = c ? { name: c.name || c.lead?.name || c.profileName, number: `+${c.waId}` } : undefined
          const total = ids.length
            ? ids.length
            : contactScope.all
              ? r.total
              : contactTags.filter((x) => contactScope.tags?.includes(x.tag)).reduce((n, x) => n + x.count, 0)
          setContactPreview({ total, sample })
        })
        .catch((err) => setError(getApiErrorMessage(err)))
    }, 200)
    return () => window.clearTimeout(t)
  }, [mode, contactScope, contactTags])

  // Lead search backs both "filter" (count + sample) and "pick" (checkbox list).
  useEffect(() => {
    if (mode === 'phones' || mode === 'contacts') return
    const t = window.setTimeout(() => {
      fetchCaptureLeads({ ...filter, page: 1, pageSize: 50 })
        .then((r) => setMatches({ items: r.items, total: r.total }))
        .catch((err) => setError(getApiErrorMessage(err)))
    }, 300)
    return () => window.clearTimeout(t)
  }, [mode, filter])

  const phoneList = phones.split(/[\n,;]+/).map((p) => p.trim()).filter(Boolean)
  const recipientCount =
    mode === 'contacts'
      ? (contactPreview?.total ?? 0)
      : mode === 'filter'
        ? (matches?.total ?? 0)
        : mode === 'pick'
          ? picked.size
          : phoneList.length
  const leadSample = mode === 'pick' ? matches?.items.find((l) => picked.has(l.id)) : mode === 'filter' ? matches?.items[0] : undefined
  const sampleLead: SampleRecipient | undefined =
    mode === 'contacts' ? contactPreview?.sample : (leadSample as unknown as SampleRecipient | undefined)
  const toggleScopeTag = (tag: string) =>
    setContactScope((prev) => {
      const current = prev.tags ?? []
      return { tags: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag] }
    })

  const close = onClose

  const specsComplete = [...header, ...body, ...Object.values(buttons)].every((s) =>
    s.mode === 'static' ? s.value.trim() : mode === 'phones' ? s.fallback.trim() : true,
  )
  const ready =
    name.trim() &&
    template &&
    recipientCount > 0 &&
    recipientCount <= MAX_RECIPIENTS &&
    specsComplete &&
    consent &&
    (!inputs?.needsHeaderMedia || /^https:\/\//i.test(mediaLink))

  const submit = async () => {
    if (!template) return
    setSaving(true)
    setError(null)
    const params: WaBroadcastParams = {
      header: header.map(toSource),
      body: body.map(toSource),
      buttons: Object.fromEntries(Object.entries(buttons).map(([k, s]) => [k, toSource(s)])),
      ...(inputs?.needsHeaderMedia ? { headerMediaLink: mediaLink } : {}),
    }
    const cleanFilter = Object.fromEntries(Object.entries(filter).filter(([, v]) => v && v !== 'all'))
    try {
      const r = await whatsappApi.createBroadcast({
        name: name.trim(),
        templateId: template.id,
        params,
        recipients:
          mode === 'contacts'
            ? { contacts: contactScope }
            : mode === 'filter'
              ? { filter: cleanFilter }
              : mode === 'pick'
                ? { leadIds: [...picked] }
                : { phones: phoneList },
      })
      toast(`Broadcast started: ${r.queued} queued${r.skipped.length ? `, ${r.skipped.length} skipped` : ''}`, 'success')
      onCreated(r.broadcast.id)
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const togglePick = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Modal
      open
      title="New broadcast"
      onClose={close}
      size="xl"
      footer={
        <>
          <button type="button" className="acl-btn acl-btn--ghost" onClick={close} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="acl-btn acl-btn--primary" onClick={submit} disabled={saving || !ready}>
            {saving ? 'Starting…' : `Send to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}`}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {error ? <Notice tone="error">{error}</Notice> : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Broadcast name">
              <input className={d.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Skyline launch — October" />
            </Field>
            <Field label="Template">
              <select className={d.select} value={templateId} onChange={(e) => {
                setTemplateId(e.target.value)
                setSpecs({})
                setMediaLink('')
              }}>
                <option value="">Select an approved template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.language}) · {t.category.toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {inputs && (inputs.needsHeaderMedia || header.length || body.length || inputs.buttonInputs.length) ? (
            <div className="space-y-2">
              <span className={d.label}>Personalise variables</span>
              {inputs.needsHeaderMedia ? (
                <Field label={`Header ${inputs.headerFormat?.toLowerCase()} link`} hint="Public https URL, same for every recipient">
                  <input className={d.input} value={mediaLink} onChange={(e) => setMediaLink(e.target.value)} placeholder="https://…" />
                </Field>
              ) : null}
              {header.map((s, i) => (
                <VarRow key={`h${i}`} label={`Header {{${inputs.headerVariables[i]}}}`} spec={s} onChange={(n) => setSpec(`h:${inputs.headerVariables[i]}`, n)} />
              ))}
              {body.map((s, i) => (
                <VarRow key={`b${i}`} label={`Body {{${inputs.bodyVariables[i]}}}`} spec={s} onChange={(n) => setSpec(`b:${inputs.bodyVariables[i]}`, n)} />
              ))}
              {inputs.buttonInputs.map((b) => (
                <VarRow key={`btn${b.index}`} label={`Button: ${b.label}`} spec={buttons[b.index]} onChange={(n) => setSpec(`btn:${b.index}`, n)} />
              ))}
              {mode === 'phones' ? <p className="text-xs text-[#8B7355]">Pasted numbers have no lead data, so lead fields use the “If empty” value.</p> : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <span className={d.label}>Recipients</span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['contacts', 'Contacts'],
                  ['filter', 'Leads matching filters'],
                  ['pick', 'Choose leads'],
                  ['phones', 'Paste numbers'],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setMode(id)} className={mode === id ? d.rangeActive : d.rangeIdle}>
                  {label}
                </button>
              ))}
            </div>

            {mode === 'contacts' ? (
              initialContacts ? (
                <p className="text-sm text-[#8B7355]">
                  To <strong className="text-[#2E2E2E]">{initialContacts.label}</strong> ({contactPreview?.total ?? '…'}). Opted-out and archived
                  contacts are skipped.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-4 text-sm text-[#2E2E2E]">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="wa-contact-scope" checked={Boolean(contactScope.all)} onChange={() => setContactScope({ all: true })} />
                      All contacts
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="wa-contact-scope"
                        checked={!contactScope.all}
                        onChange={() => setContactScope({ tags: [] })}
                        disabled={!contactTags.length}
                      />
                      Contacts with tags
                    </label>
                  </div>
                  {!contactScope.all ? (
                    <div className="flex flex-wrap gap-2">
                      {contactTags.map((t) => {
                        const on = Boolean(contactScope.tags?.includes(t.tag))
                        return (
                          <button key={t.tag} type="button" onClick={() => toggleScopeTag(t.tag)} aria-pressed={on} className={on ? d.rangeActive : d.rangeIdle}>
                            {t.tag} ({t.count})
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                  <p className="text-sm text-[#8B7355]">
                    About <strong className="text-[#2E2E2E]">{contactPreview?.total ?? '…'}</strong> contacts. Duplicates, opted-out and archived
                    contacts are skipped. Contacts without a name use the “If empty” value for name variables.
                  </p>
                </div>
              )
            ) : null}

            {mode === 'filter' || mode === 'pick' ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select className={d.select} value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} aria-label="Lead status">
                  <option value="all">Any status</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.toLowerCase()}</option>
                  ))}
                </select>
                <select className={d.select} value={filter.score} onChange={(e) => setFilter((f) => ({ ...f, score: e.target.value }))} aria-label="Lead score">
                  <option value="all">Any score</option>
                  {SCORES.map((s) => (
                    <option key={s} value={s}>{s.toLowerCase()}</option>
                  ))}
                </select>
                <select className={d.select} value={filter.source} onChange={(e) => setFilter((f) => ({ ...f, source: e.target.value }))} aria-label="Lead source">
                  <option value="all">Any source</option>
                  {CAPTURE_LEAD_SOURCE_TILE_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <input className={d.input} value={filter.q} onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))} placeholder="Search…" aria-label="Search leads" />
              </div>
            ) : null}

            {mode === 'filter' ? (
              <p className="text-sm text-[#8B7355]">
                <strong className="text-[#2E2E2E]">{matches?.total ?? '…'}</strong> leads match. Leads without a valid number, duplicates and
                opted-out contacts are skipped automatically.
              </p>
            ) : null}

            {mode === 'pick' ? (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-[#E8DCCB]">
                {(matches?.items ?? []).map((l) => (
                  <label key={l.id} className="flex cursor-pointer items-center gap-3 border-b border-[#F5EFE7] px-3 py-2 text-sm last:border-0 hover:bg-[#FAF7F2]">
                    <input type="checkbox" checked={picked.has(l.id)} onChange={() => togglePick(l.id)} />
                    <span className="flex-1 truncate text-[#2E2E2E]">{l.name}</span>
                    <span className="text-xs text-[#8B7355]">{l.whatsappNumber || l.number}</span>
                  </label>
                ))}
                {matches && matches.total > matches.items.length ? (
                  <p className="px-3 py-2 text-xs text-[#8B7355]">Showing 50 of {matches.total}. Narrow the search to find more.</p>
                ) : null}
              </div>
            ) : null}

            {mode === 'phones' ? (
              <Field label="Numbers" hint="One per line or comma-separated. Include the country code; bare 10-digit numbers are treated as +91.">
                <textarea className={`${d.input} min-h-[120px] font-mono`} value={phones} onChange={(e) => setPhones(e.target.value)} placeholder={'+91 98XXXXXXXX\n+971 5X XXX XXXX'} />
              </Field>
            ) : null}

            {recipientCount > MAX_RECIPIENTS ? (
              <Notice tone="warn">A broadcast can reach at most {MAX_RECIPIENTS} recipients. Narrow your filters.</Notice>
            ) : null}
          </div>

          <label className="flex items-start gap-2 text-sm text-[#2E2E2E]">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              These recipients have opted in to receive WhatsApp messages from us. Meta requires opt-in; messaging people who haven't
              agreed lowers your quality rating and can get the number restricted.
            </span>
          </label>
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <span className={d.label}>Preview{sampleLead ? ` · ${sampleLead.name}` : ''}</span>
          {template ? (
            <TemplatePreview
              components={template.components}
              values={{ header: header.map((s) => sampleValue(s, sampleLead)), body: body.map((s) => sampleValue(s, sampleLead)) }}
              headerMediaUrl={mediaLink}
            />
          ) : (
            <p className="text-sm text-[#8B7355]">Pick a template to preview it.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

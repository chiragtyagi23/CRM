import { useMemo, useRef, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import {
  whatsappApi,
  type WaCreateTemplateInput,
  type WaTemplateButton,
  type WaTemplateCategory,
  type WaTemplateComponent,
} from '../../lib/whatsappApi'
import { extractVariables, TEMPLATE_LANGUAGES } from '../../lib/whatsappTemplates'
import { Field, Notice, TemplatePreview } from './shared'

type HeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
type ParamFormat = 'POSITIONAL' | 'NAMED'

type ButtonDraft =
  | { kind: 'QUICK_REPLY'; text: string }
  | { kind: 'URL'; text: string; url: string; sample: string }
  | { kind: 'PHONE_NUMBER'; text: string; phone: string }
  | { kind: 'COPY_CODE'; sample: string }

const CATEGORIES: { value: WaTemplateCategory; label: string; hint: string }[] = [
  { value: 'MARKETING', label: 'Marketing', hint: 'Offers, launches, project updates, re-engagement' },
  { value: 'UTILITY', label: 'Utility', hint: 'Site-visit confirmations, reminders, account updates' },
  { value: 'AUTHENTICATION', label: 'Authentication', hint: 'One-time passcodes' },
]

const LIMITS = { headerText: 60, body: 1024, footer: 60, buttonText: 25, buttons: 10 }
const MEDIA_ACCEPT: Record<string, string> = { IMAGE: 'image/jpeg,image/png', VIDEO: 'video/mp4', DOCUMENT: 'application/pdf' }

function charCount(value: string, max: number) {
  return (
    <span className={`text-xs ${value.length > max ? 'text-[#D96B6B]' : 'text-[#8B7355]/70'}`}>
      {value.length}/{max}
    </span>
  )
}

/** Meta requires positional variables to be exactly {{1}}..{{n}}; named ones lowercase_with_underscores. */
function variableProblems(text: string, format: ParamFormat, where: string): string[] {
  const vars = extractVariables(text)
  if (!vars.length) return []
  const out: string[] = []
  if (format === 'POSITIONAL') {
    const nums = vars.map(Number)
    if (nums.some((n) => !Number.isInteger(n))) out.push(`${where}: positional variables must be numbers like {{1}}`)
    else if ([...nums].sort((a, b) => a - b).some((n, i) => n !== i + 1)) out.push(`${where}: variables must run {{1}}, {{2}}… without gaps`)
  } else if (vars.some((v) => !/^[a-z][a-z0-9_]*$/.test(v))) {
    out.push(`${where}: named variables must be lowercase letters, numbers and underscores`)
  }
  const trimmed = text.trim()
  if (/^\{\{[^}]+\}\}/.test(trimmed) || /\{\{[^}]+\}\}$/.test(trimmed)) {
    out.push(`${where}: Meta rejects templates that start or end with a variable`)
  }
  return out
}

function exampleFor(text: string, samples: Record<string, string>, format: ParamFormat, kind: 'header' | 'body') {
  const vars = extractVariables(text)
  if (!vars.length) return undefined
  if (format === 'NAMED') {
    return { [`${kind}_text_named_params`]: vars.map((v) => ({ param_name: v, example: samples[v] ?? '' })) }
  }
  const values = vars.map((v) => samples[v] ?? '')
  return kind === 'header' ? { header_text: values } : { body_text: [values] }
}

type Props = {
  open: boolean
  onClose: () => void
  onCreated: () => void
  mediaUploadEnabled: boolean
}

export function TemplateEditorModal(props: Props) {
  // Mounted only while open, so every open starts from a blank template.
  return props.open ? <TemplateEditorForm {...props} /> : null
}

function TemplateEditorForm({ onClose, onCreated, mediaUploadEnabled }: Props) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<WaTemplateCategory>('MARKETING')
  const [language, setLanguage] = useState('en')
  const [format, setFormat] = useState<ParamFormat>('POSITIONAL')
  const [headerType, setHeaderType] = useState<HeaderType>('NONE')
  const [headerText, setHeaderText] = useState('')
  const [headerFile, setHeaderFile] = useState<File | null>(null)
  const [body, setBody] = useState('')
  const [footer, setFooter] = useState('')
  const [buttons, setButtons] = useState<ButtonDraft[]>([])
  const [headerSamples, setHeaderSamples] = useState<Record<string, string>>({})
  const [bodySamples, setBodySamples] = useState<Record<string, string>>({})
  const [allowCategoryChange, setAllowCategoryChange] = useState(true)
  // Authentication templates have a fixed Meta-defined body.
  const [securityNote, setSecurityNote] = useState(true)
  const [expiryMinutes, setExpiryMinutes] = useState('10')
  const [copyText, setCopyText] = useState('Copy code')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const isAuth = category === 'AUTHENTICATION'
  const headerVars = headerType === 'TEXT' ? extractVariables(headerText) : []
  const bodyVars = extractVariables(body)
  const headerPreviewUrl = useMemo(() => (headerFile && headerType === 'IMAGE' ? URL.createObjectURL(headerFile) : undefined), [headerFile, headerType])

  const close = onClose

  const insertVariable = () => {
    const next = format === 'POSITIONAL' ? String(bodyVars.filter((v) => /^\d+$/.test(v)).length + 1) : `var_${bodyVars.length + 1}`
    const token = `{{${next}}}`
    const el = bodyRef.current
    const at = el ? el.selectionStart : body.length
    setBody(body.slice(0, at) + token + body.slice(at))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + token.length, at + token.length)
    })
  }

  const counts = {
    QUICK_REPLY: buttons.filter((b) => b.kind === 'QUICK_REPLY').length,
    URL: buttons.filter((b) => b.kind === 'URL').length,
    PHONE_NUMBER: buttons.filter((b) => b.kind === 'PHONE_NUMBER').length,
    COPY_CODE: buttons.filter((b) => b.kind === 'COPY_CODE').length,
  }
  const canAdd = (kind: ButtonDraft['kind']) => {
    if (buttons.length >= LIMITS.buttons) return false
    if (kind === 'URL') return counts.URL < 2
    if (kind === 'PHONE_NUMBER') return counts.PHONE_NUMBER < 1
    if (kind === 'COPY_CODE') return counts.COPY_CODE < 1 && category === 'MARKETING'
    return true
  }
  const addButton = (kind: ButtonDraft['kind']) => {
    const draft: ButtonDraft =
      kind === 'QUICK_REPLY'
        ? { kind, text: '' }
        : kind === 'URL'
          ? { kind, text: '', url: 'https://', sample: '' }
          : kind === 'PHONE_NUMBER'
            ? { kind, text: 'Call us', phone: '+91' }
            : { kind, sample: '' }
    setButtons((prev) => [...prev, draft])
  }
  const updateButton = (i: number, patch: Partial<ButtonDraft>) =>
    setButtons((prev) => prev.map((b, j) => (j === i ? ({ ...b, ...patch } as ButtonDraft) : b)))

  const components: WaTemplateComponent[] = useMemo(() => {
    if (isAuth) {
      return [
        { type: 'BODY', add_security_recommendation: securityNote } as WaTemplateComponent,
        ...(Number(expiryMinutes) > 0 ? [{ type: 'FOOTER', code_expiration_minutes: Number(expiryMinutes) } as WaTemplateComponent] : []),
        { type: 'BUTTONS', buttons: [{ type: 'OTP', otp_type: 'COPY_CODE', text: copyText || 'Copy code' }] },
      ]
    }
    const out: WaTemplateComponent[] = []
    if (headerType === 'TEXT' && headerText.trim()) {
      const example = exampleFor(headerText, headerSamples, format, 'header')
      out.push({ type: 'HEADER', format: 'TEXT', text: headerText, ...(example ? { example } : {}) })
    } else if (headerType !== 'NONE' && headerType !== 'TEXT') {
      out.push({ type: 'HEADER', format: headerType })
    }
    const bodyExample = exampleFor(body, bodySamples, format, 'body')
    out.push({ type: 'BODY', text: body, ...(bodyExample ? { example: bodyExample } : {}) })
    if (footer.trim()) out.push({ type: 'FOOTER', text: footer })
    if (buttons.length) {
      out.push({
        type: 'BUTTONS',
        buttons: buttons.map((b): WaTemplateButton => {
          if (b.kind === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: b.text }
          if (b.kind === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phone }
          if (b.kind === 'COPY_CODE') return { type: 'COPY_CODE', example: b.sample }
          const dynamic = extractVariables(b.url).length > 0
          return { type: 'URL', text: b.text, url: b.url, ...(dynamic ? { example: [b.url.replace(/\{\{[^}]+\}\}/, b.sample)] } : {}) }
        }),
      })
    }
    return out
  }, [isAuth, securityNote, expiryMinutes, copyText, headerType, headerText, headerSamples, format, body, bodySamples, footer, buttons])

  /** Auth templates render Meta's fixed copy; show that instead of the (empty) BODY. */
  const previewComponents: WaTemplateComponent[] = isAuth
    ? [
        { type: 'BODY', text: `*{{1}}* is your verification code.${securityNote ? ' For your security, do not share this code.' : ''}` },
        ...(Number(expiryMinutes) > 0 ? [{ type: 'FOOTER' as const, text: `This code expires in ${expiryMinutes} minutes.` }] : []),
        { type: 'BUTTONS', buttons: [{ type: 'OTP', text: copyText }] },
      ]
    : components

  const problems = isAuth
    ? []
    : [
        ...(headerType === 'TEXT' ? variableProblems(headerText, format, 'Header') : []),
        ...variableProblems(body, format, 'Body'),
        ...(headerVars.length > 1 ? ['Header: only one variable is allowed'] : []),
        ...buttons.flatMap((b) =>
          b.kind === 'URL' && extractVariables(b.url).length && !/\{\{[^}]+\}\}$/.test(b.url.trim())
            ? ['URL button: the variable must be at the end of the URL']
            : [],
        ),
      ]

  const incomplete =
    !name.trim() ||
    (!isAuth && !body.trim()) ||
    (!isAuth && body.length > LIMITS.body) ||
    headerText.length > LIMITS.headerText ||
    footer.length > LIMITS.footer ||
    (headerType === 'TEXT' && !headerText.trim()) ||
    (!isAuth && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && !headerFile) ||
    headerVars.some((v) => !headerSamples[v]?.trim()) ||
    bodyVars.some((v) => !bodySamples[v]?.trim()) ||
    buttons.some((b) =>
      b.kind === 'QUICK_REPLY'
        ? !b.text.trim()
        : b.kind === 'URL'
          ? !b.text.trim() || !/^https?:\/\//.test(b.url) || (extractVariables(b.url).length > 0 && !b.sample.trim())
          : b.kind === 'PHONE_NUMBER'
            ? !b.text.trim() || b.phone.replace(/\D/g, '').length < 8
            : !b.sample.trim(),
    )

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      let finalComponents = components
      if (!isAuth && headerFile && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
        const handle = await whatsappApi.uploadHeaderMedia(headerFile)
        finalComponents = components.map((c) => (c.type === 'HEADER' ? { ...c, example: { header_handle: [handle] } } : c))
      }
      const payload: WaCreateTemplateInput = {
        name: name.trim(),
        language,
        category,
        components: finalComponents,
        ...(!isAuth && format === 'NAMED' ? { parameterFormat: 'NAMED' } : {}),
        ...(category !== 'AUTHENTICATION' ? { allowCategoryChange } : {}),
      }
      const created = await whatsappApi.createTemplate(payload)
      toast(`Template submitted — status: ${created.status.toLowerCase()}`, 'success')
      onCreated()
      close()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title="New message template"
      onClose={close}
      size="xl"
      footer={
        <>
          <button type="button" className="acl-btn acl-btn--ghost" onClick={close} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="acl-btn acl-btn--primary" onClick={submit} disabled={saving || incomplete || problems.length > 0}>
            {saving ? 'Submitting…' : 'Submit for review'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {error ? <Notice tone="error">{error}</Notice> : null}

          <div>
            <span className={d.label}>Category</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setCategory(c.value)
                    if (c.value !== 'MARKETING') setButtons((prev) => prev.filter((b) => b.kind !== 'COPY_CODE'))
                  }}
                  aria-pressed={category === c.value}
                  className={[
                    'h-full min-w-0 rounded-lg border-2 px-3 py-2.5 text-left transition-colors',
                    category === c.value ? 'border-[#8B7355] bg-[#E8DCCB]/30' : 'border-[#E8DCCB] hover:border-[#8B7355]/50',
                  ].join(' ')}
                >
                  <span className="block break-words text-sm font-semibold text-[#2E2E2E]">{c.label}</span>
                  <span className="mt-0.5 block break-words text-xs leading-snug text-[#8B7355]">{c.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Template name" hint="Lowercase, numbers and underscores">
              <input
                className={d.input}
                value={name}
                maxLength={512}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                placeholder="site_visit_reminder"
              />
            </Field>
            <Field label="Language">
              <select className={d.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
                {TEMPLATE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({l.code})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {isAuth ? (
            <div className="space-y-4 rounded-lg border border-[#E8DCCB] p-4">
              <p className="text-sm text-[#8B7355]">
                Authentication templates use fixed wording from Meta. You choose the extras below; the code is supplied when sending.
              </p>
              <label className="flex items-center gap-2 text-sm text-[#2E2E2E]">
                <input type="checkbox" checked={securityNote} onChange={(e) => setSecurityNote(e.target.checked)} />
                Add security recommendation
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Code expires after (minutes)" hint="1–90; leave 0 to omit">
                  <input className={d.input} type="number" min={0} max={90} value={expiryMinutes} onChange={(e) => setExpiryMinutes(e.target.value)} />
                </Field>
                <Field label="Copy button text">
                  <input className={d.input} value={copyText} maxLength={LIMITS.buttonText} onChange={(e) => setCopyText(e.target.value)} />
                </Field>
              </div>
            </div>
          ) : (
            <>
              <div>
                <span className={d.label}>Variable style</span>
                <div className="inline-flex rounded-lg border border-[#E8DCCB] bg-white p-1" role="radiogroup" aria-label="Variable style">
                  {(['POSITIONAL', 'NAMED'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={format === f}
                      onClick={() => setFormat(f)}
                      className={[
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        format === f ? 'bg-[#8B7355] text-white' : 'text-[#8B7355] hover:bg-[#F5EFE7]',
                      ].join(' ')}
                    >
                      {f === 'POSITIONAL' ? 'Numbered {{1}}' : 'Named {{first_name}}'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-[#E8DCCB] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#2E2E2E]">
                    Header <span className="font-normal text-[#8B7355]">(optional)</span>
                  </span>
                  <select className={d.selectInline} value={headerType} onChange={(e) => setHeaderType(e.target.value as HeaderType)}>
                    <option value="NONE">None</option>
                    <option value="TEXT">Text</option>
                    <option value="IMAGE" disabled={!mediaUploadEnabled}>Image</option>
                    <option value="VIDEO" disabled={!mediaUploadEnabled}>Video</option>
                    <option value="DOCUMENT" disabled={!mediaUploadEnabled}>Document</option>
                  </select>
                </div>
                {!mediaUploadEnabled ? (
                  <p className="text-xs text-[#8B7355]">
                    Image, video and document headers need this account's Meta App ID (Settings → Accounts &amp; credentials).
                  </p>
                ) : null}
                {headerType === 'TEXT' ? (
                  <div>
                    <input className={d.input} value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Your site visit is confirmed" />
                    <div className="mt-1 flex justify-end">{charCount(headerText, LIMITS.headerText)}</div>
                  </div>
                ) : null}
                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) ? (
                  <Field label="Sample file" hint="Meta reviews this sample. Each send supplies its own media link.">
                    <input type="file" accept={MEDIA_ACCEPT[headerType]} onChange={(e) => setHeaderFile(e.target.files?.[0] ?? null)} className="text-sm" />
                  </Field>
                ) : null}
              </div>

              <div className="space-y-2 rounded-lg border border-[#E8DCCB] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#2E2E2E]">Body</span>
                  <button type="button" className={d.link} onClick={insertVariable}>
                    + Add variable
                  </button>
                </div>
                <textarea
                  ref={bodyRef}
                  className={`${d.input} min-h-[140px]`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={'Hi {{1}}, thanks for your interest in {{2}}. Reply YES to book a site visit.'}
                />
                <div className="flex items-center justify-between text-xs text-[#8B7355]/80">
                  <span>*bold* _italic_ ~strike~ ```mono```</span>
                  {charCount(body, LIMITS.body)}
                </div>
              </div>

              {headerVars.length || bodyVars.length ? (
                <div className="space-y-3 rounded-lg border border-[#E8DCCB] bg-[#FAF7F2] p-4">
                  <span className="block text-sm font-semibold text-[#2E2E2E]">Sample values</span>
                  <p className="text-xs text-[#8B7355]">Meta needs realistic examples to review the template. Don't use real customer data.</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {headerVars.map((v) => (
                      <Field key={`hs-${v}`} label={`Header {{${v}}}`}>
                        <input className={d.input} value={headerSamples[v] ?? ''} onChange={(e) => setHeaderSamples((p) => ({ ...p, [v]: e.target.value }))} />
                      </Field>
                    ))}
                    {bodyVars.map((v) => (
                      <Field key={`bs-${v}`} label={`Body {{${v}}}`}>
                        <input className={d.input} value={bodySamples[v] ?? ''} onChange={(e) => setBodySamples((p) => ({ ...p, [v]: e.target.value }))} />
                      </Field>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-lg border border-[#E8DCCB] p-4">
                <span className="mb-2 block text-sm font-semibold text-[#2E2E2E]">
                  Footer <span className="font-normal text-[#8B7355]">(optional)</span>
                </span>
                <input className={d.input} value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Reply STOP to unsubscribe" />
                <div className="mt-1 flex justify-end">{charCount(footer, LIMITS.footer)}</div>
              </div>

              <div className="space-y-3 rounded-lg border border-[#E8DCCB] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#2E2E2E]">
                    Buttons <span className="font-normal text-[#8B7355]">(optional, up to 10)</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['QUICK_REPLY', 'Quick reply'],
                        ['URL', 'Visit website'],
                        ['PHONE_NUMBER', 'Call phone'],
                        ['COPY_CODE', 'Copy offer code'],
                      ] as const
                    ).map(([kind, label]) =>
                      kind === 'COPY_CODE' && category !== 'MARKETING' ? null : (
                        <button key={kind} type="button" className={d.btnSecondarySm} disabled={!canAdd(kind)} onClick={() => addButton(kind)}>
                          <FiPlus size={14} aria-hidden /> {label}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                {buttons.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-[#FAF7F2] p-3">
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] sm:col-span-2">
                        {b.kind.replace('_', ' ').toLowerCase()}
                      </span>
                      {b.kind !== 'COPY_CODE' ? (
                        <input className={d.input} value={b.text} maxLength={LIMITS.buttonText} onChange={(e) => updateButton(i, { text: e.target.value })} placeholder="Button text" />
                      ) : null}
                      {b.kind === 'URL' ? (
                        <>
                          <input className={d.input} value={b.url} onChange={(e) => updateButton(i, { url: e.target.value })} placeholder="https://example.com/p/{{1}}" />
                          {extractVariables(b.url).length ? (
                            <input className={`${d.input} sm:col-span-2`} value={b.sample} onChange={(e) => updateButton(i, { sample: e.target.value })} placeholder="Sample value for {{1}}" />
                          ) : null}
                        </>
                      ) : null}
                      {b.kind === 'PHONE_NUMBER' ? (
                        <input className={d.input} value={b.phone} onChange={(e) => updateButton(i, { phone: e.target.value })} placeholder="+91XXXXXXXXXX" inputMode="tel" />
                      ) : null}
                      {b.kind === 'COPY_CODE' ? (
                        <input className={d.input} value={b.sample} maxLength={15} onChange={(e) => updateButton(i, { sample: e.target.value })} placeholder="Sample code, e.g. FESTIVE10" />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="mt-6 rounded p-1 text-[#D96B6B] hover:bg-[#D96B6B]/10"
                      onClick={() => setButtons((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="Remove button"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm text-[#2E2E2E]">
                <input type="checkbox" checked={allowCategoryChange} onChange={(e) => setAllowCategoryChange(e.target.checked)} />
                Let Meta re-assign the category if it disagrees (avoids a rejection)
              </label>
            </>
          )}

          {problems.length ? (
            <Notice tone="warn">
              <ul className="list-disc pl-4">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Notice>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <span className={d.label}>Preview</span>
          <TemplatePreview
            components={previewComponents}
            values={{
              header: headerVars.map((v) => headerSamples[v] ?? ''),
              body: isAuth ? ['123456'] : bodyVars.map((v) => bodySamples[v] ?? ''),
            }}
            headerMediaUrl={headerPreviewUrl}
          />
          <p className="mt-3 text-xs text-[#8B7355]">
            Meta usually reviews templates within minutes; some take up to 24 hours. Status updates arrive via webhook, or use
            “Sync from Meta”.
          </p>
        </div>
      </div>
    </Modal>
  )
}

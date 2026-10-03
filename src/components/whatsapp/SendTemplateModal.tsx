import { useEffect, useMemo, useState } from 'react'

import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { whatsappApi, type WaMessage, type WaTemplate } from '../../lib/whatsappApi'
import { describeInputs } from '../../lib/whatsappTemplates'
import { Field, Notice, TemplatePreview } from './shared'

type Target = { conversationId: string; label: string } | { leadId: string; label: string } | null

/**
 * Sends one approved template. With no `target`, asks for a phone number
 * (country code optional; bare 10-digit numbers are treated as +91).
 */
type Props = {
  open: boolean
  onClose: () => void
  target?: Target
  initialTemplateId?: string
  onSent?: (message: WaMessage) => void
}

export function SendTemplateModal(props: Props) {
  // Mounted only while open, so every open starts from fresh state.
  return props.open ? <SendTemplateForm {...props} /> : null
}

function SendTemplateForm({ onClose, target = null, initialTemplateId, onSent }: Props) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<WaTemplate[]>([])
  const [templateId, setTemplateId] = useState(initialTemplateId ?? '')
  const [to, setTo] = useState('')
  /** Keyed `h:<var>`, `b:<var>`, `btn:<index>` so switching templates can't misalign values. */
  const [values, setValues] = useState<Record<string, string>>({})
  const [mediaLink, setMediaLink] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    whatsappApi
      .templates({ status: 'APPROVED' })
      .then(setTemplates)
      .catch((err) => setError(getApiErrorMessage(err)))
  }, [])

  const template = templates.find((t) => t.id === templateId)
  const inputs = useMemo(() => (template ? describeInputs(template) : null), [template])
  const header = (inputs?.headerVariables ?? []).map((n) => values[`h:${n}`] ?? '')
  const body = (inputs?.bodyVariables ?? []).map((n) => values[`b:${n}`] ?? '')
  const buttons = Object.fromEntries((inputs?.buttonInputs ?? []).map((b) => [String(b.index), values[`btn:${b.index}`] ?? '']))
  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }))

  const selectTemplate = (id: string) => {
    setTemplateId(id)
    setValues({})
    setMediaLink('')
  }

  const submit = async () => {
    if (!template) return
    setSending(true)
    setError(null)
    try {
      const message = await whatsappApi.sendTemplate({
        templateId: template.id,
        ...(target && 'conversationId' in target ? { conversationId: target.conversationId } : {}),
        ...(target && 'leadId' in target ? { leadId: target.leadId } : {}),
        ...(!target ? { to } : {}),
        params: {
          header,
          body,
          buttons,
          ...(inputs?.needsHeaderMedia ? { headerMediaLink: mediaLink } : {}),
        },
      })
      toast('Template sent', 'success')
      onSent?.(message)
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const missing =
    !template ||
    (!target && to.replace(/\D/g, '').length < 8) ||
    header.some((v) => !v.trim()) ||
    body.some((v) => !v.trim()) ||
    Object.values(buttons).some((v) => !v.trim()) ||
    (inputs?.needsHeaderMedia && !/^https:\/\//i.test(mediaLink))

  return (
    <Modal
      open
      title="Send template message"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="acl-btn acl-btn--ghost" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button type="button" className="acl-btn acl-btn--primary" onClick={submit} disabled={sending || missing}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {error ? <Notice tone="error">{error}</Notice> : null}
          {target ? (
            <p className="text-sm text-[#8B7355]">
              To: <strong className="text-[#2E2E2E]">{target.label}</strong>
            </p>
          ) : (
            <Field label="WhatsApp number" hint="Include the country code, e.g. +91 98XXXXXXXX">
              <input className={d.input} value={to} onChange={(e) => setTo(e.target.value)} placeholder="+91 98XXXXXXXX" inputMode="tel" />
            </Field>
          )}

          <Field label="Template" hint={templates.length ? undefined : 'No approved templates yet — create one and wait for Meta approval.'}>
            <select className={d.select} value={templateId} onChange={(e) => selectTemplate(e.target.value)}>
              <option value="">Select an approved template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.language}) · {t.category.toLowerCase()}
                </option>
              ))}
            </select>
          </Field>

          {inputs?.needsHeaderMedia ? (
            <Field label={`Header ${inputs.headerFormat?.toLowerCase()} link`} hint="Public https URL Meta can download">
              <input className={d.input} value={mediaLink} onChange={(e) => setMediaLink(e.target.value)} placeholder="https://…" />
            </Field>
          ) : null}
          {inputs?.headerVariables.map((name, i) => (
            <Field key={`h-${name}`} label={`Header {{${name}}}`}>
              <input
                className={d.input}
                value={header[i]}
                onChange={(e) => setValue(`h:${name}`, e.target.value)}
              />
            </Field>
          ))}
          {inputs?.bodyVariables.map((name, i) => (
            <Field key={`b-${name}`} label={`Body {{${name}}}`}>
              <input
                className={d.input}
                value={body[i]}
                onChange={(e) => setValue(`b:${name}`, e.target.value)}
              />
            </Field>
          ))}
          {inputs?.buttonInputs.map((b) => (
            <Field
              key={`btn-${b.index}`}
              label={b.type === 'URL' ? `Button "${b.label}" URL suffix` : b.label}
              hint={b.type === 'URL' ? 'Replaces {{1}} at the end of the button URL' : undefined}
            >
              <input
                className={d.input}
                value={buttons[b.index]}
                onChange={(e) => setValue(`btn:${b.index}`, e.target.value)}
              />
            </Field>
          ))}
        </div>
        <div>
          <span className={d.label}>Preview</span>
          {template ? (
            <TemplatePreview components={template.components} values={{ header, body }} headerMediaUrl={mediaLink} />
          ) : (
            <p className="text-sm text-[#8B7355]">Pick a template to preview it.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

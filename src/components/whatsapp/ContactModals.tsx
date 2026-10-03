import { useState } from 'react'
import { FiDownload, FiX } from 'react-icons/fi'

import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { whatsappApi, type WaContactImportResult, type WaContactImportRow, type WaConversation } from '../../lib/whatsappApi'
import { downloadContactsTemplate, parseContactsFile, parseContactsText, splitTags } from './contactImport'
import { Field, Notice } from './shared'
import { fmtPhone } from './format'

/** Chips + free-text entry; Enter or comma adds a tag. */
export function TagInput({ value, onChange, suggestions = [] }: { value: string[]; onChange: (tags: string[]) => void; suggestions?: string[] }) {
  const [draft, setDraft] = useState('')
  const add = (raw: string) => {
    const next = [...value]
    for (const t of splitTags(raw)) if (!next.some((x) => x.toLowerCase() === t.toLowerCase())) next.push(t)
    onChange(next.slice(0, 20))
    setDraft('')
  }
  const listId = 'wa-tag-suggestions'
  return (
    <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-[#E8DCCB] bg-white px-2 py-1.5 focus-within:border-[#8B7355]">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#F5EFE7] px-2 py-0.5 text-xs font-medium text-[#6d5a43]">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-[#8B7355] hover:text-[#2E2E2E]">
            <FiX size={11} />
          </button>
        </span>
      ))}
      <input
        list={suggestions.length ? listId : undefined}
        className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-[#2E2E2E] outline-none placeholder:text-[#8B7355]/60"
        value={draft}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim()) {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? '' : 'e.g. site-visit, nri'}
        aria-label="Tags"
      />
      {suggestions.length ? (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      ) : null}
    </div>
  )
}

function ConsentCheckbox({ checked, onChange, plural }: { checked: boolean; onChange: (v: boolean) => void; plural?: boolean }) {
  return (
    <label className="flex items-start gap-2 text-sm text-[#2E2E2E]">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {plural ? 'These people have' : 'This person has'} agreed to receive WhatsApp messages from us. Meta requires opt-in; messaging people
        who haven't agreed can get the number restricted.
      </span>
    </label>
  )
}

type ContactModalProps = { open: boolean; contact: WaConversation | null; tagSuggestions: string[]; onClose: () => void; onSaved: () => void }

/** Add (contact = null) or edit a contact. Mounted only while open. */
export function ContactModal(props: ContactModalProps) {
  return props.open ? <ContactForm {...props} /> : null
}

function ContactForm({ contact, tagSuggestions, onClose, onSaved }: ContactModalProps) {
  const { toast } = useToast()
  const [name, setName] = useState(contact?.name ?? '')
  const [phone, setPhone] = useState('')
  const [tags, setTags] = useState<string[]>(contact?.tags ?? [])
  const [consent, setConsent] = useState(false)
  const [consentNote, setConsentNote] = useState(contact?.consentNote ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editing = Boolean(contact)
  const ready = editing || (phone.replace(/\D/g, '').length >= 8 && consent)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      if (contact) {
        await whatsappApi.updateContact(contact.id, { name: name.trim() || null, tags, consentNote: consentNote.trim() || null })
        toast('Contact updated', 'success')
      } else {
        await whatsappApi.createContact({ name: name.trim() || undefined, phone, tags, consent: true, consentNote: consentNote.trim() || undefined })
        toast('Contact added', 'success')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={editing ? 'Edit contact' : 'Add contact'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="acl-btn acl-btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="acl-btn acl-btn--primary" onClick={save} disabled={saving || !ready}>
            {saving ? 'Saving…' : editing ? 'Save' : 'Add contact'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Field label="Name">
          <input className={d.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" maxLength={120} />
        </Field>
        {editing ? (
          <p className="text-sm text-[#8B7355]">
            Number: <strong className="text-[#2E2E2E]">{fmtPhone(contact!.waId)}</strong>
          </p>
        ) : (
          <Field label="WhatsApp number" hint="Include the country code. Bare 10-digit numbers are treated as +91.">
            <input className={d.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" inputMode="tel" />
          </Field>
        )}
        <Field label="Tags" hint="Group contacts to message them together, e.g. a project or campaign.">
          <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
        </Field>
        <Field label="How they opted in (optional)">
          <input className={d.input} value={consentNote} onChange={(e) => setConsentNote(e.target.value)} placeholder="e.g. Site visit form, 12 Sep" maxLength={500} />
        </Field>
        {!editing ? <ConsentCheckbox checked={consent} onChange={setConsent} /> : null}
      </div>
    </Modal>
  )
}

type ImportProps = { open: boolean; tagSuggestions: string[]; onClose: () => void; onImported: () => void }

export function ImportContactsModal(props: ImportProps) {
  return props.open ? <ImportForm {...props} /> : null
}

function ImportForm({ tagSuggestions, onClose, onImported }: ImportProps) {
  const { toast } = useToast()
  const [rows, setRows] = useState<WaContactImportRow[]>([])
  const [pasted, setPasted] = useState('')
  const [fileName, setFileName] = useState('')
  const [defaultTags, setDefaultTags] = useState<string[]>([])
  const [consent, setConsent] = useState(false)
  const [consentNote, setConsentNote] = useState('')
  const [result, setResult] = useState<WaContactImportResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const parsed = await parseContactsFile(file)
      setRows(parsed)
      setFileName(file.name)
      setPasted('')
      if (!parsed.length) setError('No rows with a phone number found. Use a header row with "phone" (and optional "name", "tags").')
    } catch {
      setError('Could not read that file. Use .csv or .xlsx.')
    }
  }

  const onPaste = (text: string) => {
    setPasted(text)
    setFileName('')
    setRows(text.trim() ? parseContactsText(text) : [])
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await whatsappApi.importContacts({ rows, defaultTags, consent: true, consentNote: consentNote.trim() || undefined })
      setResult(r)
      toast(`Imported: ${r.created} new, ${r.updated} updated`, 'success')
      onImported()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title="Import contacts"
      onClose={onClose}
      wide
      footer={
        result ? (
          <button type="button" className="acl-btn acl-btn--primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="acl-btn acl-btn--primary" onClick={submit} disabled={busy || !rows.length || !consent || rows.length > 5000}>
              {busy ? 'Importing…' : `Import ${rows.length} contact${rows.length === 1 ? '' : 's'}`}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <Notice>
            <strong>{result.created}</strong> new contacts, <strong>{result.updated}</strong> existing contacts updated
            {result.invalid.length ? `, ${result.invalid.length} rows skipped` : ''}.
          </Notice>
          {result.invalid.length ? (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
              {result.invalid.map((r) => (
                <li key={r.row} className="flex justify-between gap-3">
                  <span className="text-[#2E2E2E]">Row {r.row}: {r.phone || '(empty)'}</span>
                  <span className="text-[#8B7355]">{r.reason}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {error ? <Notice tone="error">{error}</Notice> : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className={`${d.btnSecondarySm} cursor-pointer`}>
              Choose .csv / .xlsx
              <input type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
            </label>
            <button type="button" className={d.link} onClick={downloadContactsTemplate}>
              <FiDownload className="mr-1 inline" size={13} aria-hidden /> Download template
            </button>
          </div>
          {fileName ? <p className="text-sm text-[#8B7355]">{fileName}</p> : null}
          <Field label="…or paste rows" hint="Header row with phone (and optional name, tags), or columns name, phone, tags. Separate multiple tags with ;">
            <textarea className={`${d.input} min-h-[110px] font-mono text-xs`} value={pasted} onChange={(e) => onPaste(e.target.value)} placeholder={'name,phone,tags\nCustomer A,+91 90000 00000,site-visit'} />
          </Field>

          {rows.length ? (
            <div>
              <p className="mb-2 text-sm text-[#8B7355]">
                {rows.length} row{rows.length === 1 ? '' : 's'} found{rows.length > 5000 ? ' — the limit is 5,000 per import' : ''}. Numbers are checked on import; existing contacts are
                updated, not duplicated.
              </p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-[#E8DCCB]">
                <table className="w-full text-sm">
                  <tbody>
                    {rows.slice(0, 8).map((r, i) => (
                      <tr key={i} className="border-b border-[#F5EFE7] last:border-0">
                        <td className="px-3 py-1.5 text-[#2E2E2E]">{r.name || '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{r.phone}</td>
                        <td className="px-3 py-1.5 text-xs text-[#8B7355]">{r.tags?.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 8 ? <p className="mt-1 text-xs text-[#8B7355]">…and {rows.length - 8} more</p> : null}
            </div>
          ) : null}

          <Field label="Add these tags to every imported contact (optional)">
            <TagInput value={defaultTags} onChange={setDefaultTags} suggestions={tagSuggestions} />
          </Field>
          <Field label="How they opted in (optional)">
            <input className={d.input} value={consentNote} onChange={(e) => setConsentNote(e.target.value)} placeholder="e.g. Expo sign-up sheet, Sep 2026" maxLength={500} />
          </Field>
          <ConsentCheckbox checked={consent} onChange={setConsent} plural />
        </div>
      )}
    </Modal>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiEdit2, FiEye, FiEyeOff, FiPlus, FiRefreshCw, FiUsers, FiXCircle } from 'react-icons/fi'

import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getCrmApiBaseUrl } from '../../lib/crmApi'
import { getApiErrorMessage } from '../../services/aclHttp'
import { whatsappApi, type WaAccountDetail, type WaAccountInput } from '../../lib/whatsappApi'
import { Field, Notice } from './shared'
import { fmtDateTime } from './format'

type SecretKey = 'accessToken' | 'appSecret' | 'webhookVerifyToken' | 'aiWebhookSecret' | 'aiApiKey'
/** undefined = keep current, null = clear, string = replace */
type SecretDraft = Partial<Record<SecretKey, string | null>>

function AccountHealth({ a }: { a: WaAccountDetail }) {
  if (!a.isActive) return <span className={d.badgeCold}>Inactive</span>
  if (!a.ready) return <span className={d.badgeWarm}>Incomplete</span>
  if (a.lastError) return <span className={d.badgeHot} title={a.lastError}>Error</span>
  if (a.lastVerifiedAt) return <span className={d.badgeWon}>Connected</span>
  return <span className={d.badgeWarm}>Not verified</span>
}

/**
 * Write-only secret input. Shows only whether a value is stored; typing a new value replaces it.
 * The stored value is never sent back to the browser.
 */
function SecretField({
  label,
  hint,
  isSet,
  value,
  onChange,
  clearable,
  minLength,
}: {
  label: string
  hint?: string
  isSet: boolean
  value: string | null | undefined
  onChange: (v: string | null | undefined) => void
  clearable?: boolean
  minLength?: number
}) {
  const [show, setShow] = useState(false)
  const editing = value !== undefined && value !== null
  const cleared = value === null

  if (isSet && !editing && !cleared) {
    return (
      <Field label={label} hint={hint}>
        <div className="flex items-center gap-2">
          <span className="flex-1 rounded-lg border border-[#E8DCCB] bg-[#FAF7F2] px-3 py-2 text-sm text-[#8B7355]">•••••••• stored securely</span>
          <button type="button" className={d.btnSecondarySm} onClick={() => onChange('')}>Replace</button>
          {clearable ? (
            <button type="button" className="text-sm font-semibold text-[#D96B6B] hover:underline" onClick={() => onChange(null)}>
              Remove
            </button>
          ) : null}
        </div>
      </Field>
    )
  }
  if (cleared) {
    return (
      <Field label={label}>
        <div className="flex items-center gap-2 text-sm text-[#D96B6B]">
          Will be removed on save.
          <button type="button" className={d.link} onClick={() => onChange(undefined)}>Undo</button>
        </div>
      </Field>
    )
  }
  const tooShort = Boolean(minLength && value && value.length < minLength)
  return (
    <Field label={label} hint={tooShort ? `At least ${minLength} characters` : hint}>
      <div className="flex items-center gap-2">
        <input
          className={d.input}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          spellCheck={false}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isSet ? 'Enter a new value' : 'Paste value'}
        />
        <button type="button" className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide value' : 'Show value'}>
          {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
        {isSet ? (
          <button type="button" className={d.link} onClick={() => onChange(undefined)}>Cancel</button>
        ) : null}
      </div>
    </Field>
  )
}

type AccountModalProps = { open: boolean; account: WaAccountDetail | null; onClose: () => void; onSaved: () => void }

export function AccountModal(props: AccountModalProps) {
  return props.open ? <AccountForm {...props} /> : null
}

function AccountForm({ account, onClose, onSaved }: AccountModalProps) {
  const { toast } = useToast()
  const [name, setName] = useState(account?.name ?? '')
  const [phoneNumberId, setPhoneNumberId] = useState(account?.phoneNumberId ?? '')
  const [businessAccountId, setBusinessAccountId] = useState(account?.businessAccountId ?? '')
  const [appId, setAppId] = useState(account?.appId ?? '')
  const [graphVersion, setGraphVersion] = useState(account?.graphVersion ?? 'v23.0')
  const [aiWebhookUrl, setAiWebhookUrl] = useState(account?.aiWebhookUrl ?? '')
  const [secrets, setSecrets] = useState<SecretDraft>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setSecret = (k: SecretKey) => (v: string | null | undefined) =>
    setSecrets((prev) => {
      const next = { ...prev }
      if (v === undefined) delete next[k]
      else next[k] = v
      return next
    })
  const isSet = (k: SecretKey) => Boolean(account?.secrets[k])

  const numeric = (v: string) => /^\d{5,32}$/.test(v.trim())
  const secretProblems = Object.entries(secrets).some(([k, v]) => typeof v === 'string' && (!v.trim() || (k === 'aiApiKey' && v.trim().length < 24)))
  const ready =
    name.trim() &&
    numeric(phoneNumberId) &&
    numeric(businessAccountId) &&
    (!appId.trim() || numeric(appId)) &&
    /^v\d{1,2}\.\d$/.test(graphVersion.trim()) &&
    (!aiWebhookUrl.trim() || /^https?:\/\//i.test(aiWebhookUrl.trim())) &&
    !secretProblems

  const save = async () => {
    setSaving(true)
    setError(null)
    const body: WaAccountInput = {
      name: name.trim(),
      phoneNumberId: phoneNumberId.trim(),
      businessAccountId: businessAccountId.trim(),
      appId: appId.trim() || null,
      graphVersion: graphVersion.trim(),
      aiWebhookUrl: aiWebhookUrl.trim() || null,
    }
    for (const [k, v] of Object.entries(secrets) as [SecretKey, string | null][]) {
      body[k] = v === null ? null : v.trim()
    }
    try {
      const saved = account ? await whatsappApi.updateAccount(account.id, body) : await whatsappApi.createAccount(body)
      toast(saved.lastError ? `Saved, but Meta rejected the credentials: ${saved.lastError}` : 'Account saved', saved.lastError ? 'error' : 'success')
      onSaved()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const webhookUrl = account ? `${getCrmApiBaseUrl()}${account.webhookPath}` : null

  return (
    <Modal
      open
      title={account ? `Edit ${account.name}` : 'Add WhatsApp account'}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="acl-btn acl-btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="acl-btn acl-btn--primary" onClick={save} disabled={saving || !ready}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Notice>
          Secrets are encrypted on the server and can never be viewed again after saving; to change one, replace it. Find the values in Meta
          Business Manager → WhatsApp Manager → API Setup, and your app's Settings → Basic. Use a System User token with the{' '}
          <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions.
        </Notice>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[#2E2E2E]">Meta account</h3>
          <Field label="Account name" hint="Shown in the account switcher, e.g. the team or number it's for.">
            <input className={d.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Sales India" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone number ID">
              <input className={`${d.input} font-mono`} value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="WhatsApp Business Account ID">
              <input className={`${d.input} font-mono`} value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Meta App ID (optional)" hint="Needed for image/video/document template headers.">
              <input className={`${d.input} font-mono`} value={appId} onChange={(e) => setAppId(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Graph API version">
              <input className={`${d.input} font-mono`} value={graphVersion} onChange={(e) => setGraphVersion(e.target.value)} />
            </Field>
          </div>
          <SecretField label="Access token" isSet={isSet('accessToken')} value={secrets.accessToken} onChange={setSecret('accessToken')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SecretField
              label="App secret"
              hint="Verifies that webhook calls really come from Meta."
              isSet={isSet('appSecret')}
              value={secrets.appSecret}
              onChange={setSecret('appSecret')}
            />
            <SecretField
              label="Webhook verify token"
              hint="Any value you choose; enter the same one in Meta's webhook settings."
              isSet={isSet('webhookVerifyToken')}
              value={secrets.webhookVerifyToken}
              onChange={setSecret('webhookVerifyToken')}
            />
          </div>
          {webhookUrl ? (
            <Field label="Webhook callback URL for this account" hint="Paste into Meta App Dashboard → WhatsApp → Configuration.">
              <code className="block truncate rounded-lg bg-[#FAF7F2] px-3 py-2 text-xs text-[#2E2E2E]">{webhookUrl}</code>
            </Field>
          ) : (
            <p className="text-xs text-[#8B7355]">The webhook callback URL is shown after the account is saved.</p>
          )}
        </section>

        <section className="space-y-4 border-t border-[#E8DCCB] pt-5">
          <h3 className="text-sm font-semibold text-[#2E2E2E]">
            AI agent <span className="font-normal text-[#8B7355]">(optional)</span>
          </h3>
          <Field label="AI webhook URL" hint="Your AI backend's endpoint for this account's incoming messages.">
            <input className={d.input} value={aiWebhookUrl} onChange={(e) => setAiWebhookUrl(e.target.value)} placeholder="https://ai.example.com/whatsapp" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SecretField
              label="AI signing secret"
              hint="Signs each forwarded message (X-CRM-Signature)."
              isSet={isSet('aiWebhookSecret')}
              value={secrets.aiWebhookSecret}
              onChange={setSecret('aiWebhookSecret')}
              clearable
            />
            <SecretField
              label="AI API key"
              hint="Your AI backend sends this as x-api-key when replying. Random, 24+ characters."
              isSet={isSet('aiApiKey')}
              value={secrets.aiApiKey}
              onChange={setSecret('aiApiKey')}
              clearable
              minLength={24}
            />
          </div>
        </section>
      </div>
    </Modal>
  )
}

type UsersModalProps = { account: WaAccountDetail | null; onClose: () => void; onSaved: () => void }

function AccountUsersModal({ account, onClose, onSaved }: UsersModalProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!account) return
    Promise.all([whatsappApi.assignableUsers(), whatsappApi.accountUsers(account.id)])
      .then(([all, ids]) => {
        setUsers(all)
        setSelected(new Set(ids))
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [account])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(s)) : users
  }, [users, q])

  const save = async () => {
    if (!account) return
    setSaving(true)
    try {
      await whatsappApi.setAccountUsers(account.id, [...selected])
      toast('Access updated', 'success')
      onSaved()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Modal
      open
      title={account ? `Who can use ${account.name}` : ''}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="acl-btn acl-btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="acl-btn acl-btn--primary" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : `Save (${selected.size})`}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {error ? <Notice tone="error">{error}</Notice> : null}
        <p className="text-sm text-[#8B7355]">
          Assigned users see this account's inbox, contacts, templates and broadcasts. People who can manage accounts see every account.
        </p>
        <input className={d.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" aria-label="Search users" />
        <div className="max-h-72 overflow-y-auto rounded-lg border border-[#E8DCCB]">
          {loading ? <p className="p-3 text-sm text-[#8B7355]">Loading…</p> : null}
          {shown.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-3 border-b border-[#F5EFE7] px-3 py-2 text-sm last:border-0 hover:bg-[#FAF7F2]">
              <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
              <span className="flex-1 truncate text-[#2E2E2E]">{u.name}</span>
              <span className="truncate text-xs text-[#8B7355]">{u.email}</span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}

/** Settings → Accounts: every WhatsApp account, its credential health, and who can use it. */
export function AccountsManager({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<WaAccountDetail[]>([])
  const [encryptionConfigured, setEncryptionConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<WaAccountDetail | null>(null)
  const [adding, setAdding] = useState(false)
  const [assigning, setAssigning] = useState<WaAccountDetail | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(
    () =>
      whatsappApi
        .accounts()
        .then((r) => {
          setItems(r.items as WaAccountDetail[])
          setEncryptionConfigured(r.encryptionConfigured)
          setError(null)
        })
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    void load()
  }, [load])

  const changed = () => {
    void load()
    onChanged()
  }

  const verify = async (a: WaAccountDetail) => {
    setBusyId(a.id)
    try {
      const r = await whatsappApi.verifyAccount(a.id)
      toast(r.lastError ? `Meta rejected the credentials: ${r.lastError}` : `Connected: ${r.displayPhoneNumber ?? r.name}`, r.lastError ? 'error' : 'success')
      changed()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = async (a: WaAccountDetail) => {
    setBusyId(a.id)
    try {
      await whatsappApi.updateAccount(a.id, { isActive: !a.isActive })
      toast(a.isActive ? `${a.name} deactivated` : `${a.name} activated`, 'success')
      changed()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className={d.cardP5}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#2E2E2E]">Accounts &amp; credentials</h3>
          <p className="text-xs text-[#8B7355]">Each account is one WhatsApp number with its own Meta and AI credentials.</p>
        </div>
        <button type="button" className={d.btnPrimarySm} onClick={() => setAdding(true)} disabled={!encryptionConfigured}>
          <FiPlus size={14} aria-hidden /> Add account
        </button>
      </div>

      {!encryptionConfigured ? (
        <div className="mb-3">
          <Notice tone="warn">
            The server has no <code>CREDENTIALS_ENCRYPTION_KEY</code>, so credentials can't be stored. Generate one with{' '}
            <code>openssl rand -base64 32</code>, add it to the backend environment, and restart. Keep it stable — changing it makes
            saved credentials unreadable.
          </Notice>
        </div>
      ) : null}
      {error ? <div className="mb-3"><Notice tone="error">{error}</Notice></div> : null}

      {loading ? (
        <p className="text-sm text-[#8B7355]">Loading…</p>
      ) : !items.length ? (
        <p className="text-sm text-[#8B7355]">No accounts yet. Add one to start using WhatsApp.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#E8DCCB]">
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8B7355]">Account</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8B7355]">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8B7355]">AI</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8B7355]">Users</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className={d.trBorder}>
                  <td className="px-3 py-2 text-sm">
                    <span className="font-medium text-[#2E2E2E]">{a.name}</span>
                    <span className="block text-xs text-[#8B7355]">
                      {a.displayPhoneNumber || `Phone number ID ${a.phoneNumberId}`}
                      {a.verifiedName ? ` · ${a.verifiedName}` : ''}
                    </span>
                    {a.lastError ? <span className="block text-xs text-[#D96B6B]">{a.lastError}</span> : null}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <AccountHealth a={a} />
                    {a.lastVerifiedAt ? <span className="block text-xs text-[#8B7355]">checked {fmtDateTime(a.lastVerifiedAt)}</span> : null}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {a.aiWebhookUrl && a.secrets.aiWebhookSecret ? (
                      <FiCheckCircle className="text-[#6FAF8F]" aria-label="AI forwarding on" />
                    ) : (
                      <FiXCircle className="text-[#C9B79C]" aria-label="AI forwarding off" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm">{a.userCount ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <button type="button" className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]" title="Check connection" aria-label="Check connection" disabled={busyId === a.id || !a.ready} onClick={() => verify(a)}>
                        <FiRefreshCw size={16} className={busyId === a.id ? 'animate-spin' : ''} />
                      </button>
                      <button type="button" className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]" title="Who can use it" aria-label="Who can use it" onClick={() => setAssigning(a)}>
                        <FiUsers size={16} />
                      </button>
                      <button type="button" className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]" title="Edit credentials" aria-label="Edit credentials" onClick={() => setEditing(a)}>
                        <FiEdit2 size={16} />
                      </button>
                      <button type="button" className={`${d.link} px-2`} disabled={busyId === a.id} onClick={() => toggleActive(a)}>
                        {a.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AccountModal open={adding || Boolean(editing)} account={editing} onClose={() => { setAdding(false); setEditing(null) }} onSaved={changed} />
      {assigning ? <AccountUsersModal account={assigning} onClose={() => setAssigning(null)} onSaved={changed} /> : null}
    </section>
  )
}

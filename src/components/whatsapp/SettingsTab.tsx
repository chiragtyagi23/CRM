import { useState, type ReactNode } from 'react'
import { FiCheckCircle, FiCopy, FiXCircle } from 'react-icons/fi'

import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getCrmApiBaseUrl } from '../../lib/crmApi'
import { getApiErrorMessage } from '../../services/aclHttp'
import { whatsappApi, type WaBusinessProfile, type WaPermissions, type WaStatus } from '../../lib/whatsappApi'
import { Field, Notice, QualityBadge } from './shared'
import { AccountsManager } from './AccountsManager'

const WEBHOOK_FIELDS = ['messages', 'message_template_status_update', 'message_template_quality_update', 'template_category_update']
const VERTICALS = ['OTHER', 'PROF_SERVICES', 'FINANCE', 'RETAIL', 'HOTEL', 'TRAVEL', 'EDU', 'EVENT_PLAN', 'UNDEFINED']

const TIER_LABEL: Record<string, string> = {
  TIER_250: '250 customers / 24h',
  TIER_1K: '1,000 customers / 24h',
  TIER_10K: '10,000 customers / 24h',
  TIER_100K: '100,000 customers / 24h',
  TIER_UNLIMITED: 'Unlimited',
}

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? <FiCheckCircle className="mt-0.5 shrink-0 text-[#6FAF8F]" aria-label="Done" /> : <FiXCircle className="mt-0.5 shrink-0 text-[#D96B6B]" aria-label="Missing" />}
      <span className="text-[#2E2E2E]">{children}</span>
    </li>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#F5EFE7] py-2 text-sm last:border-0">
      <dt className="text-[#8B7355]">{label}</dt>
      <dd className="text-right font-medium text-[#2E2E2E]">{children}</dd>
    </div>
  )
}

type SettingsProps = {
  status: WaStatus | null
  perms: WaPermissions
  onRefresh: () => Promise<void>
  /** Called when accounts are added/edited so the page's account switcher refreshes. */
  onAccountsChanged: () => void
}

export function SettingsTab({ status, perms, onRefresh, onAccountsChanged }: SettingsProps) {
  return (
    <div className="space-y-6">
      {perms.accounts ? (
        <AccountsManager
          onChanged={() => {
            onAccountsChanged()
            void onRefresh()
          }}
        />
      ) : null}
      {status ? <AccountSettings status={status} perms={perms} onRefresh={onRefresh} /> : null}
    </div>
  )
}

function AccountSettings({ status, perms, onRefresh }: Omit<SettingsProps, 'onAccountsChanged'>) {
  const { toast } = useToast()
  if (!status) return null

  const callbackUrl = `${getCrmApiBaseUrl()}${status.webhook.path}`
  const replyUrl = `${getCrmApiBaseUrl()}${status.agent.replyPath}`
  const phone = status.phone

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast('Copied', 'success')
    } catch {
      toast('Copy failed — select the text instead', 'error')
    }
  }

  const editable = perms.settings && status.configured

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className={d.stack}>
        <section className={d.cardP5}>
          <h3 className="mb-1 text-sm font-semibold text-[#2E2E2E]">{status.account.name}: connection checklist</h3>
          <p className="mb-3 text-xs text-[#8B7355]">
            {perms.accounts ? 'Edit these under Accounts & credentials above.' : 'An account manager sets these credentials.'}
          </p>
          <ul className="space-y-2">
            <Check ok={status.configured}>Access token, phone number ID and business account ID</Check>
            <Check ok={status.configured && !status.error}>Meta API reachable with those credentials</Check>
            <Check ok={status.webhook.verifyTokenSet}>Webhook verify token</Check>
            <Check ok={status.webhook.appSecretSet}>App secret (verifies webhook signatures)</Check>
            <Check ok={status.headerMediaUploadEnabled}>Optional: Meta App ID for image/video/document template headers</Check>
          </ul>
          <p className="mt-3 text-xs text-[#8B7355]">
            Credentials are stored encrypted and never shown again after saving. Graph API {status.graphVersion}.
          </p>
          {status.error ? <div className="mt-3"><Notice tone="error">{status.error}</Notice></div> : null}
        </section>

        <section className={d.cardP5}>
          <h3 className="mb-3 text-sm font-semibold text-[#2E2E2E]">Webhook</h3>
          <p className="mb-3 text-sm text-[#8B7355]">
            In the Meta App Dashboard → WhatsApp → Configuration, set this callback URL and your verify token, then subscribe to the fields below.
            Without it, delivered/read ticks, incoming messages and template approvals won't reach the CRM.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-[#FAF7F2] px-3 py-2 text-xs text-[#2E2E2E]">{callbackUrl}</code>
            <button type="button" className={d.btnSecondarySm} onClick={() => copy(callbackUrl)} aria-label="Copy callback URL">
              <FiCopy size={14} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {WEBHOOK_FIELDS.map((f) => (
              <code key={f} className="rounded bg-[#F5EFE7] px-2 py-1 text-xs text-[#6d5a43]">{f}</code>
            ))}
          </div>
        </section>

        <section className={d.cardP5}>
          <h3 className="mb-3 text-sm font-semibold text-[#2E2E2E]">AI agent</h3>
          <p className="mb-3 text-sm text-[#8B7355]">
            Each customer message is forwarded to your AI backend, which replies inline or through the reply API below. Team members can pause
            the AI per chat from the Inbox. Full contract: <code>CRM-backend/docs/whatsapp-ai-agent.md</code>.
          </p>
          <ul className="space-y-2">
            <Check ok={status.agent.webhookUrlSet}>AI webhook URL</Check>
            <Check ok={status.agent.webhookSecretSet}>
              AI signing secret (sent as <code>X-CRM-Signature</code>)
            </Check>
            <Check ok={status.agent.apiKeySet}>
              AI API key (your backend sends it as <code>x-api-key</code>; it identifies this account)
            </Check>
          </ul>
          <span className="mb-1 mt-4 block text-xs font-medium text-[#8B7355]">Reply endpoint (POST)</span>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-[#FAF7F2] px-3 py-2 text-xs text-[#2E2E2E]">{replyUrl}</code>
            <button type="button" className={d.btnSecondarySm} onClick={() => copy(replyUrl)} aria-label="Copy reply endpoint">
              <FiCopy size={14} />
            </button>
          </div>
          {!status.agent.forwardingEnabled ? (
            <p className="mt-3 text-xs text-[#8B7355]">Forwarding is off until both the URL and signing secret are set.</p>
          ) : null}
        </section>
      </div>

      <div className={d.stack}>
        <section className={d.cardP5}>
          <h3 className="mb-2 text-sm font-semibold text-[#2E2E2E]">Phone number</h3>
          {phone ? (
            <dl>
              <Row label="Display number">{phone.display_phone_number ?? '—'}</Row>
              <Row label="Verified name">
                {phone.verified_name ?? '—'}
                {phone.name_status ? <span className="block text-xs font-normal text-[#8B7355]">{phone.name_status.replace(/_/g, ' ').toLowerCase()}</span> : null}
              </Row>
              <Row label="Quality rating"><QualityBadge score={phone.quality_rating} /></Row>
              <Row label="Messaging limit">{TIER_LABEL[phone.messaging_limit_tier ?? ''] ?? phone.messaging_limit_tier ?? '—'}</Row>
              <Row label="Throughput">{phone.throughput?.level?.toLowerCase() ?? '—'}</Row>
              <Row label="Status">{phone.status?.toLowerCase() ?? '—'}</Row>
              <Row label="Verification">{phone.code_verification_status?.replace(/_/g, ' ').toLowerCase() ?? '—'}</Row>
            </dl>
          ) : (
            <p className="text-sm text-[#8B7355]">{status.configured ? 'Could not load phone number details.' : 'Not connected.'}</p>
          )}
        </section>

        <BusinessProfileForm key={JSON.stringify(status.profile ?? {})} initial={status.profile ?? {}} editable={editable} onSaved={onRefresh} />
      </div>
    </div>
  )
}

function BusinessProfileForm({ initial, editable, onSaved }: { initial: WaBusinessProfile; editable: boolean; onSaved: () => Promise<void> }) {
  const { toast } = useToast()
  const [profile, setProfile] = useState<WaBusinessProfile>(() => ({
    ...initial,
    websites: [...(initial.websites ?? []), '', ''].slice(0, 2),
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await whatsappApi.updateBusinessProfile({
        about: profile.about,
        description: profile.description,
        address: profile.address,
        email: profile.email,
        vertical: profile.vertical,
        websites: (profile.websites ?? []).map((w) => w.trim()).filter(Boolean),
      })
      toast('Business profile updated', 'success')
      await onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
        <section className={d.cardP5}>
          <h3 className="mb-3 text-sm font-semibold text-[#2E2E2E]">Business profile</h3>
          {error ? <div className="mb-3"><Notice tone="error">{error}</Notice></div> : null}
          <fieldset disabled={!editable} className="space-y-4">
            {profile.profile_picture_url ? (
              <img src={profile.profile_picture_url} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
            ) : null}
            <Field label="About" hint={`${(profile.about ?? '').length}/139 — shown under the business name`}>
              <input className={d.input} maxLength={139} value={profile.about ?? ''} onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))} />
            </Field>
            <Field label="Description">
              <textarea className={`${d.input} min-h-[90px]`} maxLength={512} value={profile.description ?? ''} onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))} />
            </Field>
            <Field label="Address">
              <input className={d.input} maxLength={256} value={profile.address ?? ''} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input className={d.input} type="email" value={profile.email ?? ''} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
              </Field>
              <Field label="Industry">
                <select className={d.select} value={profile.vertical ?? 'UNDEFINED'} onChange={(e) => setProfile((p) => ({ ...p, vertical: e.target.value }))}>
                  {[...new Set([...(profile.vertical ? [profile.vertical] : []), ...VERTICALS])].map((v) => (
                    <option key={v} value={v}>{v.replace(/_/g, ' ').toLowerCase()}</option>
                  ))}
                </select>
              </Field>
            </div>
            {[0, 1].map((i) => (
              <Field key={i} label={`Website ${i + 1}`}>
                <input
                  className={d.input}
                  type="url"
                  placeholder="https://"
                  value={profile.websites?.[i] ?? ''}
                  onChange={(e) =>
                    setProfile((p) => {
                      const websites = [...(p.websites ?? ['', ''])]
                      websites[i] = e.target.value
                      return { ...p, websites }
                    })
                  }
                />
              </Field>
            ))}
          </fieldset>
          {editable ? (
            <div className="mt-4 flex justify-end">
              <button type="button" className={d.btnPrimarySm} onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          ) : null}
        </section>
  )
}

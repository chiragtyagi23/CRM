import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiBarChart2, FiFileText, FiMessageCircle, FiSend, FiSettings, FiUsers } from 'react-icons/fi'

import { PageHeader } from '../components/PageHeader'
import { EmptyState, Notice } from '../components/whatsapp/shared'
import { OverviewTab } from '../components/whatsapp/OverviewTab'
import { InboxTab } from '../components/whatsapp/InboxTab'
import { ContactsTab } from '../components/whatsapp/ContactsTab'
import { TemplatesTab } from '../components/whatsapp/TemplatesTab'
import { BroadcastsTab } from '../components/whatsapp/BroadcastsTab'
import { SettingsTab } from '../components/whatsapp/SettingsTab'
import { useACL } from '../acl/useACL'
import { useAppDispatch } from '../store/hooks'
import { refreshAccess } from '../store/authSlice'
import { d } from '../lib/designClasses'
import { getApiErrorMessage } from '../services/aclHttp'
import { setWhatsappAccountId, whatsappApi, type WaAccount, type WaPermissions, type WaStatus } from '../lib/whatsappApi'
import { fmtPhone } from '../components/whatsapp/format'

const TABS = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'inbox', label: 'Inbox', icon: FiMessageCircle },
  { id: 'contacts', label: 'Contacts', icon: FiUsers },
  { id: 'templates', label: 'Templates', icon: FiFileText },
  { id: 'broadcasts', label: 'Broadcasts', icon: FiSend },
  { id: 'settings', label: 'Settings', icon: FiSettings },
] as const

type TabId = (typeof TABS)[number]['id']

const LS_ACCOUNT = 'crm_wa_account'

function readStoredAccount(): string | null {
  try {
    return window.localStorage.getItem(LS_ACCOUNT)
  } catch {
    return null
  }
}

function storeAccount(id: string) {
  try {
    window.localStorage.setItem(LS_ACCOUNT, id)
  } catch {
    // per-browser convenience only
  }
}

export function WhatsApp() {
  const [params, setParams] = useSearchParams()
  const { hasAccess } = useACL()
  const dispatch = useAppDispatch()
  const [accounts, setAccounts] = useState<WaAccount[] | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ accountId: string; value: WaStatus } | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const tabParam = params.get('tab')
  const perms: WaPermissions = {
    send: hasAccess('whatsapp.send'),
    templates: hasAccess('whatsapp.templates'),
    settings: hasAccess('whatsapp.settings'),
    contacts: hasAccess('whatsapp.contacts'),
    // The server is authoritative; the browser's permission copy may predate newly added modules.
    accounts: hasAccess('whatsapp.accounts') || canManage,
  }
  const visibleTabs = TABS.filter((t) => t.id !== 'contacts' || perms.contacts)

  const loadAccounts = useCallback(
    () =>
      whatsappApi.accounts().then(
        (r) => {
          setAccounts(r.items)
          setCanManage(r.canManage)
          setAccountsError(null)
          setAccountId((current) => {
            const keep = [current, readStoredAccount()].find((id) => id && r.items.some((a) => a.id === id))
            const next = keep ?? r.items.find((a) => a.isActive)?.id ?? r.items[0]?.id ?? null
            // Every WhatsApp API call is scoped by this id (sent as X-WhatsApp-Account).
            setWhatsappAccountId(next)
            if (next) storeAccount(next)
            return next
          })
        },
        (err) => setAccountsError(getApiErrorMessage(err)),
      ),
    [],
  )

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  // Permissions are saved at login; refresh them so modules granted since then (e.g. contacts) show up.
  useEffect(() => {
    void dispatch(refreshAccess())
  }, [dispatch])

  const loadStatus = useCallback(() => {
    if (!accountId) return Promise.resolve()
    const id = accountId
    return whatsappApi.status().then(
      (s) => {
        setStatus({ accountId: id, value: s })
        setStatusError(null)
      },
      (err) => setStatusError(getApiErrorMessage(err)),
    )
  }, [accountId])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const tab: TabId = visibleTabs.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'overview'

  const selectTab = (id: TabId) => {
    const next = new URLSearchParams(params)
    next.set('tab', id)
    next.delete('conversation')
    next.delete('broadcast')
    setParams(next, { replace: true })
  }

  const onSwitch = (id: string) => {
    setWhatsappAccountId(id)
    storeAccount(id)
    setAccountId(id)
    // Open chats/broadcasts belong to the previous account.
    const next = new URLSearchParams(params)
    next.delete('conversation')
    next.delete('broadcast')
    setParams(next, { replace: true })
  }

  // Status loaded for another account is stale — never show it.
  const current = status && status.accountId === accountId ? status.value : null
  const account = accounts?.find((a) => a.id === accountId) ?? null
  const phone = current?.phone
  const subtitle = phone?.display_phone_number
    ? `${phone.verified_name ?? 'Business'} · ${phone.display_phone_number.startsWith('+') ? phone.display_phone_number : fmtPhone(phone.display_phone_number)}`
    : 'Templates, broadcasts, conversations and message insights'

  const switcher =
    accounts && accounts.length > 0 ? (
      <label className="flex items-center gap-2 text-sm text-[#8B7355]">
        <span className="hidden sm:inline">Account</span>
        <select className={`${d.selectInline} min-w-[200px]`} value={accountId ?? ''} onChange={(e) => onSwitch(e.target.value)} aria-label="WhatsApp account">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.displayPhoneNumber ? ` · ${a.displayPhoneNumber}` : ''}
              {a.isActive ? '' : ' (inactive)'}
            </option>
          ))}
        </select>
      </label>
    ) : null

  if (accountsError) {
    return (
      <div>
        <PageHeader title="WhatsApp" subtitle={subtitle} />
        <Notice tone="error">Could not load WhatsApp accounts: {accountsError}</Notice>
      </div>
    )
  }

  if (!accounts) {
    return (
      <div>
        <PageHeader title="WhatsApp" subtitle={subtitle} />
        <p className="text-sm text-[#8B7355]">Loading…</p>
      </div>
    )
  }

  if (!accounts.length) {
    return (
      <div>
        <PageHeader title="WhatsApp" subtitle="Connect a WhatsApp Business number to get started" />
        {canManage ? (
          <SettingsTab status={null} perms={perms} onRefresh={loadStatus} onAccountsChanged={() => void loadAccounts()} />
        ) : (
          <EmptyState title="No WhatsApp account yet">
            You haven't been given access to a WhatsApp account. Ask an admin to add you to one in WhatsApp → Settings → Accounts &
            credentials.
          </EmptyState>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="WhatsApp" subtitle={subtitle} actions={switcher} />

      {statusError ? <div className="mb-4"><Notice tone="error">Could not load WhatsApp status: {statusError}</Notice></div> : null}
      {account && !account.isActive ? (
        <div className="mb-4">
          <Notice tone="warn">This account is deactivated. History stays visible; nothing can be sent and webhooks are ignored.</Notice>
        </div>
      ) : current && !current.configured ? (
        <div className="mb-4">
          <Notice tone="warn">
            This account's Meta credentials are incomplete, so sending is disabled.{' '}
            {perms.accounts ? 'Complete them in Settings → Accounts & credentials.' : 'Ask an admin to complete them.'}
          </Notice>
        </div>
      ) : null}
      {current?.error ? (
        <div className="mb-4">
          <Notice tone="error">Meta API error: {current.error}</Notice>
        </div>
      ) : null}

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#8B7355]/10 bg-white p-1" role="tablist">
        {visibleTabs.map((t) => {
          const active = t.id === tab
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(t.id)}
              className={[
                'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                active ? 'bg-[#8B7355] text-white' : 'text-[#8B7355] hover:bg-[#F5EFE7]',
              ].join(' ')}
            >
              <Icon size={15} aria-hidden />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Keyed by account so every tab remounts with fresh state when the account changes. */}
      <div key={accountId ?? 'none'}>
        {tab === 'overview' ? <OverviewTab status={current} /> : null}
        {tab === 'inbox' ? <InboxTab status={current} perms={perms} /> : null}
        {tab === 'contacts' ? <ContactsTab status={current} perms={perms} /> : null}
        {tab === 'templates' ? <TemplatesTab status={current} perms={perms} /> : null}
        {tab === 'broadcasts' ? <BroadcastsTab status={current} perms={perms} /> : null}
        {tab === 'settings' ? (
          <SettingsTab status={current} perms={perms} onRefresh={loadStatus} onAccountsChanged={() => void loadAccounts()} />
        ) : null}
      </div>
    </div>
  )
}

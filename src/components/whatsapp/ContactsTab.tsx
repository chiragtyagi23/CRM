import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiArchive, FiEdit2, FiMessageCircle, FiPlus, FiSend, FiUpload } from 'react-icons/fi'

import { ConfirmModal } from '../acl/ConfirmModal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { whatsappApi, type WaContactRecipients, type WaConversation, type WaPermissions, type WaStatus } from '../../lib/whatsappApi'
import { ContactModal, ImportContactsModal } from './ContactModals'
import { NewBroadcastModal } from './NewBroadcastModal'
import { EmptyState, Notice } from './shared'
import { fmtListStamp, fmtPhone } from './format'

const PAGE_SIZE = 50

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Added',
  import: 'Imported',
  inbound: 'Messaged you',
  send: 'Messaged',
  broadcast: 'Broadcast',
}

type BroadcastTarget = { recipients: WaContactRecipients; label: string }

export function ContactsTab({ status, perms }: { status: WaStatus | null; perms: WaPermissions }) {
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<WaConversation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [consent, setConsent] = useState<'' | 'reachable' | 'opted_out'>('')
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<WaConversation | null>(null)
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [archiving, setArchiving] = useState<WaConversation | null>(null)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastTarget | null>(null)

  const canBroadcast = perms.send && Boolean(status?.configured)

  const load = useCallback(
    () =>
      Promise.all([
        whatsappApi.contacts({ q: q || undefined, tag: tag || undefined, consent: consent || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        whatsappApi.contactTags(),
      ])
        .then(([r, t]) => {
          setItems(r.items)
          setTotal(r.total)
          setTags(t)
          setError(null)
        })
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setLoading(false)),
    [q, tag, consent, page],
  )

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(t)
  }, [load])

  const setFilter = (fn: () => void) => {
    fn()
    setPage(0)
    setSelected(new Set())
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const allOnPageSelected = items.length > 0 && items.every((c) => selected.has(c.id))
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      for (const c of items) {
        if (allOnPageSelected) next.delete(c.id)
        else next.add(c.id)
      }
      return next
    })

  const confirmArchive = async () => {
    if (!archiving) return
    setArchiveBusy(true)
    try {
      await whatsappApi.updateContact(archiving.id, { archived: true })
      toast('Contact archived', 'success')
      setArchiving(null)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(archiving.id)
        return next
      })
      void load()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setArchiveBusy(false)
    }
  }

  const openChat = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('tab', 'inbox')
    next.set('conversation', id)
    setParams(next)
  }

  const afterBroadcast = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('tab', 'broadcasts')
    next.set('broadcast', id)
    setParams(next)
  }

  const tagNames = tags.map((t) => t.tag)
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className={d.stack}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <input className={`${d.input} w-full sm:w-72`} value={q} onChange={(e) => setFilter(() => setQ(e.target.value))} placeholder="Search name or number…" aria-label="Search contacts" />
          <select className={d.selectInline} value={tag} onChange={(e) => setFilter(() => setTag(e.target.value))} aria-label="Filter by tag">
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t.tag} value={t.tag}>
                {t.tag} ({t.count})
              </option>
            ))}
          </select>
          <select className={d.selectInline} value={consent} onChange={(e) => setFilter(() => setConsent(e.target.value as typeof consent))} aria-label="Filter by status">
            <option value="">Everyone</option>
            <option value="reachable">Reachable</option>
            <option value="opted_out">Opted out</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={d.btnSecondarySm} onClick={() => setImporting(true)}>
            <FiUpload size={14} aria-hidden /> Import
          </button>
          <button type="button" className={d.btnPrimarySm} onClick={() => setAdding(true)}>
            <FiPlus size={14} aria-hidden /> Add contact
          </button>
        </div>
      </div>

      {canBroadcast && total > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#8B7355]/10 bg-white px-4 py-3 text-sm">
          <FiSend className="text-[#8B7355]" aria-hidden />
          <span className="text-[#8B7355]">Send a template to</span>
          {selected.size ? (
            <button type="button" className={d.btnPrimarySm} onClick={() => setBroadcastTarget({ recipients: { ids: [...selected] }, label: `${selected.size} selected contact${selected.size === 1 ? '' : 's'}` })}>
              {selected.size} selected
            </button>
          ) : null}
          {tag ? (
            <button type="button" className={d.btnSecondarySm} onClick={() => setBroadcastTarget({ recipients: { tags: [tag] }, label: `contacts tagged “${tag}”` })}>
              everyone tagged “{tag}”
            </button>
          ) : null}
          <button type="button" className={d.btnSecondarySm} onClick={() => setBroadcastTarget({ recipients: { all: true }, label: 'all contacts' })}>
            all contacts
          </button>
          {selected.size ? (
            <button type="button" className={`${d.link} ml-auto`} onClick={() => setSelected(new Set())}>
              Clear selection
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      {!loading && total === 0 && !q && !tag && !consent ? (
        <EmptyState
          title="No contacts yet"
          action={
            <div className="flex gap-2">
              <button type="button" className={d.btnSecondarySm} onClick={() => setImporting(true)}>
                <FiUpload size={14} aria-hidden /> Import from CSV / Excel
              </button>
              <button type="button" className={d.btnPrimarySm} onClick={() => setAdding(true)}>
                <FiPlus size={14} aria-hidden /> Add contact
              </button>
            </div>
          }
        >
          Add the people you want to reach on WhatsApp, tag them into groups, then send an approved template to everyone at once. People who
          message your number are added automatically.
        </EmptyState>
      ) : (
        <div className={d.tableWrap}>
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[#E8DCCB]">
                <th className={`${d.th} w-10`}>
                  <input type="checkbox" checked={allOnPageSelected} onChange={togglePage} aria-label="Select all on this page" />
                </th>
                <th className={d.th}>Contact</th>
                <th className={d.th}>Tags</th>
                <th className={d.th}>Status</th>
                <th className={d.th}>Last message</th>
                <th className={`${d.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !items.length ? (
                <tr>
                  <td className={d.td} colSpan={6}>Loading…</td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td className={d.td} colSpan={6}>No contacts match these filters.</td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className={`${d.trBorder} hover:bg-[#FAF7F2]`}>
                    <td className={d.td}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} aria-label={`Select ${c.name || c.waId}`} />
                    </td>
                    <td className={d.td}>
                      <span className="font-medium">{c.name || c.lead?.name || c.profileName || '—'}</span>
                      <span className="block text-xs text-[#8B7355]">
                        {fmtPhone(c.waId)}
                        {c.source ? ` · ${SOURCE_LABEL[c.source] ?? c.source}` : ''}
                        {c.lead ? ' · lead' : ''}
                      </span>
                    </td>
                    <td className={d.td}>
                      <div className="flex max-w-[260px] flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <button key={t} type="button" onClick={() => setFilter(() => setTag(t))} className="rounded-full bg-[#F5EFE7] px-2 py-0.5 text-xs font-medium text-[#6d5a43] hover:bg-[#E8DCCB]">
                            {t}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className={d.td}>{c.optedOut ? <span className={d.badgeHot}>Opted out</span> : <span className={d.badgeWon}>Reachable</span>}</td>
                    <td className={`${d.td} text-[#8B7355]`}>{c.lastMessageAt ? fmtListStamp(c.lastMessageAt) : '—'}</td>
                    <td className={`${d.td} text-right`}>
                      <div className="inline-flex gap-1">
                        {c.lastMessageAt ? (
                          <button type="button" className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]" title="Open chat" aria-label="Open chat" onClick={() => openChat(c.id)}>
                            <FiMessageCircle size={16} />
                          </button>
                        ) : null}
                        <button type="button" className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]" title="Edit" aria-label="Edit contact" onClick={() => setEditing(c)}>
                          <FiEdit2 size={16} />
                        </button>
                        <button type="button" className="rounded p-2 text-[#D96B6B] hover:bg-[#D96B6B]/10" title="Archive" aria-label="Archive contact" onClick={() => setArchiving(c)}>
                          <FiArchive size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm text-[#8B7355]">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} of {total}
          </span>
          <div className="flex gap-2">
            <button type="button" className={d.btnSecondarySm} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button type="button" className={d.btnSecondarySm} disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      ) : null}

      <ContactModal open={adding || Boolean(editing)} contact={editing} tagSuggestions={tagNames} onClose={() => {
          setAdding(false)
          setEditing(null)
        }} onSaved={() => void load()} />
      <ImportContactsModal open={importing} tagSuggestions={tagNames} onClose={() => setImporting(false)} onImported={() => void load()} />
      <ConfirmModal
        open={Boolean(archiving)}
        title="Archive contact?"
        message="They'll be hidden from Contacts and left out of broadcasts. Chat history stays in the Inbox. Adding the same number again restores them."
        confirmLabel="Archive"
        danger
        loading={archiveBusy}
        onConfirm={confirmArchive}
        onClose={() => setArchiving(null)}
      />
      <NewBroadcastModal
        open={Boolean(broadcastTarget)}
        onClose={() => setBroadcastTarget(null)}
        onCreated={afterBroadcast}
        initialContacts={broadcastTarget ?? undefined}
      />
    </div>
  )
}

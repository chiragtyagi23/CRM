import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiClock, FiCpu, FiFileText, FiPlus, FiSend, FiUser } from 'react-icons/fi'

import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { whatsappApi, type WaConversation, type WaMessage, type WaPermissions, type WaStatus } from '../../lib/whatsappApi'
import { formatWhatsAppText } from '../../lib/whatsappTemplates'
import { EmptyState, MessageTicks, Notice } from './shared'
import { SendTemplateModal } from './SendTemplateModal'
import { fmtDayHeading, fmtHoursLeft, fmtListStamp, fmtPhone, fmtTime } from './format'

/** No push channel yet — poll. Thread refreshes faster than the list. */
const LIST_POLL_MS = 15000
const THREAD_POLL_MS = 7000
const NO_MESSAGES: WaMessage[] = []

type Thread = { id: string; conv: WaConversation; messages: WaMessage[] }

function displayName(c: WaConversation) {
  return c.name || c.lead?.name || c.profileName || fmtPhone(c.waId)
}

function Avatar({ name }: { name: string }) {
  const initials = name.replace(/^\+/, '').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8DCCB] text-sm font-semibold text-[#8B7355]" aria-hidden>
      {initials || <FiUser />}
    </span>
  )
}

function Bubble({ m }: { m: WaMessage }) {
  const out = m.direction === 'outbound'
  return (
    <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[78%] rounded-lg px-3 py-1.5 shadow-sm',
          out ? 'rounded-tr-none bg-[#d9fdd3]' : 'rounded-tl-none bg-white',
          m.status === 'failed' ? 'ring-1 ring-[#D96B6B]/50' : '',
        ].join(' ')}
      >
        {m.sentBy === 'ai-agent' || m.type === 'template' ? (
          <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#667781]">
            {m.sentBy === 'ai-agent' ? (
              <span className="inline-flex items-center gap-1 rounded bg-[#e7e0f7] px-1.5 py-px text-[#5b3fb0]">
                <FiCpu size={10} aria-hidden /> AI
              </span>
            ) : null}
            {m.type === 'template' ? (
              <span className="inline-flex items-center gap-1">
                <FiFileText size={10} aria-hidden /> {m.templateName}
              </span>
            ) : null}
          </p>
        ) : null}
        <p
          className="whitespace-pre-wrap break-words text-[14px] leading-[19px] text-[#111b21]"
          dangerouslySetInnerHTML={{ __html: formatWhatsAppText(m.body || `[${m.type}]`) }}
        />
        {m.status === 'failed' && m.error ? (
          <p className="mt-1 text-[11px] text-[#D96B6B]">{m.error.message || m.error.title}</p>
        ) : null}
        <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#667781]">
          {fmtTime(m.created_at)}
          {out ? <MessageTicks status={m.status} error={m.error?.message} /> : null}
        </p>
      </div>
    </div>
  )
}

export function InboxTab({ status, perms }: { status: WaStatus | null; perms: WaPermissions }) {
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const activeId = params.get('conversation')
  const [list, setList] = useState<WaConversation[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [thread, setThread] = useState<Thread | null>(null)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  const canSend = perms.send && Boolean(status?.configured)
  const agentConnected = Boolean(status?.agent?.forwardingEnabled || status?.agent?.apiKeySet)
  const [aiBusy, setAiBusy] = useState(false)
  // A thread loaded for another conversation is stale — never show it.
  const current = thread && thread.id === activeId ? thread : null
  const active = current?.conv ?? null
  const messages = current?.messages ?? NO_MESSAGES

  const loadList = useCallback(async () => {
    try {
      const r = await whatsappApi.conversations({ q: q || undefined, unread: unreadOnly, limit: 100 })
      setList(r.items)
      setListError(null)
    } catch (err) {
      setListError(getApiErrorMessage(err))
    } finally {
      setListLoading(false)
    }
  }, [q, unreadOnly])

  useEffect(() => {
    const first = window.setTimeout(() => void loadList(), 250)
    const every = window.setInterval(() => void loadList(), LIST_POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(every)
    }
  }, [loadList])

  const loadThread = useCallback(async (id: string) => {
    try {
      const [conv, msgs] = await Promise.all([whatsappApi.conversation(id), whatsappApi.messages(id, { limit: 200 })])
      setThread({ id, conv, messages: msgs })
      setThreadError(null)
      if (conv.unreadCount > 0) {
        const read = await whatsappApi.markRead(id)
        setThread((t) => (t && t.id === id ? { ...t, conv: read } : t))
        setList((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)))
      }
    } catch (err) {
      setThreadError(getApiErrorMessage(err))
    }
  }, [])

  useEffect(() => {
    if (!activeId) return
    lastCountRef.current = 0
    const first = window.setTimeout(() => void loadThread(activeId), 0)
    const every = window.setInterval(() => void loadThread(activeId), THREAD_POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(every)
    }
  }, [activeId, loadThread])

  // Stick to the bottom only when new messages arrive, not on every poll.
  useEffect(() => {
    if (messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    }
  }, [messages])

  const open = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('conversation', id)
    else next.delete('conversation')
    setParams(next, { replace: true })
  }

  const send = async () => {
    if (!active || !text.trim()) return
    setSending(true)
    try {
      const m = await whatsappApi.sendText({ conversationId: active.id, text })
      setThread((t) => (t && t.id === m.conversationId ? { ...t, messages: [...t.messages, m] } : t))
      setText('')
      // A manual reply pauses the AI server-side; reflect it without waiting for the next poll.
      setThread((t) => (t && t.id === m.conversationId ? { ...t, conv: { ...t.conv, aiEnabled: false } } : t))
      void loadList()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
      void loadThread(active.id)
    } finally {
      setSending(false)
    }
  }

  const toggleAi = async () => {
    if (!active) return
    setAiBusy(true)
    try {
      const conv = await whatsappApi.setAi(active.id, !active.aiEnabled)
      setThread((t) => (t && t.id === conv.id ? { ...t, conv } : t))
      toast(conv.aiEnabled ? 'AI replies resumed for this chat' : 'AI paused — you are handling this chat', 'success')
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setAiBusy(false)
    }
  }

  const afterTemplateSent = (m: WaMessage) => {
    void loadList()
    if (m.conversationId === activeId) void loadThread(m.conversationId)
    else open(m.conversationId)
  }

  return (
    <div className="grid h-[calc(100vh-260px)] min-h-[520px] grid-cols-1 overflow-hidden rounded-xl border border-[#8B7355]/10 bg-white md:grid-cols-[340px_minmax(0,1fr)]">
      <aside className={`flex min-h-0 flex-col border-r border-[#E8DCCB] ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <div className="space-y-2 border-b border-[#E8DCCB] p-3">
          <div className="flex gap-2">
            <input className={d.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or number…" aria-label="Search conversations" />
            {canSend ? (
              <button type="button" className={`${d.btnPrimarySm} shrink-0 px-3`} onClick={() => setNewChatOpen(true)} title="New conversation" aria-label="New conversation">
                <FiPlus size={16} />
              </button>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#8B7355]">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /> Unread only
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {listError ? <div className="p-3"><Notice tone="error">{listError}</Notice></div> : null}
          {listLoading ? <p className="p-4 text-sm text-[#8B7355]">Loading…</p> : null}
          {!listLoading && !list.length ? (
            <p className="p-4 text-sm text-[#8B7355]">No conversations yet. Incoming WhatsApp messages and anything you send show up here.</p>
          ) : null}
          <ul>
            {list.map((c) => {
              const name = displayName(c)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => open(c.id)}
                    className={`flex w-full items-center gap-3 border-b border-[#F5EFE7] px-3 py-3 text-left transition-colors ${c.id === activeId ? 'bg-[#F5EFE7]' : 'hover:bg-[#FAF7F2]'}`}
                  >
                    <Avatar name={name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[#2E2E2E]">{name}</span>
                        <span className={`shrink-0 text-[11px] ${c.unreadCount ? 'font-semibold text-[#25a244]' : 'text-[#8B7355]'}`}>{fmtListStamp(c.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-[#8B7355]">{c.lastMessagePreview || fmtPhone(c.waId)}</span>
                        {c.unreadCount ? (
                          <span className="shrink-0 rounded-full bg-[#25d366] px-1.5 text-[11px] font-semibold text-white">{c.unreadCount}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <section className={`min-h-0 flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
        {!activeId ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState title="Select a conversation">
              Replies are free-form while the customer's 24-hour window is open. After that, send an approved template to restart the chat.
            </EmptyState>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-[#E8DCCB] px-4 py-3">
              <button type="button" className="rounded p-1 text-[#8B7355] md:hidden" onClick={() => open(null)} aria-label="Back to conversations">
                <FiArrowLeft size={18} />
              </button>
              {active ? (
                <>
                  <Avatar name={displayName(active)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#2E2E2E]">{displayName(active)}</p>
                    <p className="truncate text-xs text-[#8B7355]">
                      {fmtPhone(active.waId)}
                      {active.profileName && active.lead ? ` · WhatsApp name: ${active.profileName}` : ''}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    {agentConnected ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active.aiEnabled}
                        onClick={toggleAi}
                        disabled={aiBusy || !perms.send}
                        title={active.aiEnabled ? 'AI is answering this chat. Click to take over.' : 'AI is paused. Click to hand the chat back to AI.'}
                        className={[
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                          active.aiEnabled ? 'bg-[#e7e0f7] text-[#5b3fb0] hover:bg-[#dcd2f3]' : 'bg-[#F5EFE7] text-[#8B7355] hover:bg-[#E8DCCB]',
                        ].join(' ')}
                      >
                        <FiCpu size={12} aria-hidden /> AI {active.aiEnabled ? 'on' : 'paused'}
                      </button>
                    ) : null}
                    {active.optedOut ? <span className={d.badgeHot}>Opted out</span> : null}
                    <span className={active.windowOpen ? d.badgeWon : d.badgeCold} title="Customer service window">
                      <FiClock size={11} className="mr-1" aria-hidden />
                      {active.windowOpen ? fmtHoursLeft(active.windowExpiresAt) : 'Window closed'}
                    </span>
                    {active.lead ? (
                      <Link to={`/leads/viewdetail/${active.lead.id}`} className={d.btnSecondarySm}>
                        View lead
                      </Link>
                    ) : null}
                  </div>
                </>
              ) : null}
            </header>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#EFE7DD] px-4 py-4">
              {threadError ? <Notice tone="error">{threadError}</Notice> : null}
              {messages.map((m, i) => {
                const day = new Date(m.created_at).toDateString()
                const newDay = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== day
                return (
                  <Fragment key={m.id}>
                    {newDay ? (
                      <div className="flex justify-center py-1">
                        <span className="rounded-md bg-white/90 px-3 py-1 text-[11px] font-medium text-[#54656f] shadow-sm">{fmtDayHeading(m.created_at)}</span>
                      </div>
                    ) : null}
                    <Bubble m={m} />
                  </Fragment>
                )
              })}
            </div>

            <footer className="border-t border-[#E8DCCB] p-3">
              {!canSend ? (
                <p className="text-center text-sm text-[#8B7355]">
                  {perms.send ? 'Connect the WhatsApp Cloud API to reply.' : "You don't have permission to send WhatsApp messages."}
                </p>
              ) : active?.optedOut ? (
                <p className="text-center text-sm text-[#8B7355]">This contact replied STOP. They must message you (or send START) before you can reach them again.</p>
              ) : active && !active.windowOpen ? (
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                  <p className="text-sm text-[#8B7355]">The 24-hour window is closed. Only approved templates can be sent.</p>
                  <button type="button" className={d.btnPrimarySm} onClick={() => setTemplateOpen(true)}>
                    <FiFileText size={14} aria-hidden /> Send template
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                {agentConnected && active?.aiEnabled ? (
                  <p className="text-center text-xs text-[#5b3fb0]">AI is answering this chat. Sending a message yourself pauses it.</p>
                ) : null}
                <div className="flex items-end gap-2">
                  <button type="button" className="rounded-lg p-2 text-[#8B7355] hover:bg-[#F5EFE7]" onClick={() => setTemplateOpen(true)} title="Send a template" aria-label="Send a template">
                    <FiFileText size={18} />
                  </button>
                  <textarea
                    className={`${d.input} max-h-40 min-h-[42px] resize-none`}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void send()
                      }
                    }}
                    placeholder="Type a message"
                    aria-label="Message"
                  />
                  <button type="button" className={`${d.btnPrimarySm} px-3`} onClick={send} disabled={sending || !text.trim()} aria-label="Send">
                    <FiSend size={16} />
                  </button>
                </div>
                </div>
              )}
            </footer>
          </>
        )}
      </section>

      <SendTemplateModal open={newChatOpen} onClose={() => setNewChatOpen(false)} onSent={afterTemplateSent} />
      <SendTemplateModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        target={active ? { conversationId: active.id, label: `${displayName(active)} (${fmtPhone(active.waId)})` } : null}
        onSent={afterTemplateSent}
      />
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { FiPlus, FiRefreshCw, FiSend, FiTrash2 } from 'react-icons/fi'

import { ConfirmModal } from '../acl/ConfirmModal'
import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { whatsappApi, type WaPermissions, type WaStatus, type WaTemplate } from '../../lib/whatsappApi'
import { CategoryBadge, EmptyState, Notice, QualityBadge, TemplatePreview, TemplateStatusBadge } from './shared'
import { TemplateEditorModal } from './TemplateEditorModal'
import { SendTemplateModal } from './SendTemplateModal'
import { fmtDateTime } from './format'

export function TemplatesTab({ status, perms }: { status: WaStatus | null; perms: WaPermissions }) {
  const { toast } = useToast()
  const [items, setItems] = useState<WaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [viewing, setViewing] = useState<WaTemplate | null>(null)
  const [sendingWith, setSendingWith] = useState<WaTemplate | null>(null)
  const [deleting, setDeleting] = useState<WaTemplate | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const configured = Boolean(status?.configured)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await whatsappApi.templates({ q: q || undefined, status: statusFilter, category }))
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [q, statusFilter, category])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(t)
  }, [load])

  const sync = async () => {
    setSyncing(true)
    try {
      const r = await whatsappApi.syncTemplates()
      toast(`Synced ${r.synced} template${r.synced === 1 ? '' : 's'}${r.removed ? `, removed ${r.removed}` : ''}`, 'success')
      await load()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setSyncing(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await whatsappApi.deleteTemplate(deleting.id)
      toast(`Deleted ${deleting.name} (${deleting.language})`, 'success')
      setDeleting(null)
      await load()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className={d.stack}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <input className={`${d.input} w-full sm:w-72`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" aria-label="Search templates" />
          <select className={d.selectInline} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAUSED">Paused</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <select className={d.selectInline} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utility</option>
            <option value="AUTHENTICATION">Authentication</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {perms.templates ? (
            <>
              <button type="button" className={d.btnSecondarySm} onClick={sync} disabled={!configured || syncing}>
                <FiRefreshCw size={14} className={syncing ? 'animate-spin' : ''} aria-hidden /> Sync from Meta
              </button>
              <button type="button" className={d.btnPrimarySm} onClick={() => setEditorOpen(true)} disabled={!configured}>
                <FiPlus size={14} aria-hidden /> New template
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {!loading && !items.length ? (
        <EmptyState
          title="No templates yet"
          action={
            perms.templates && configured ? (
              <button type="button" className={d.btnPrimarySm} onClick={sync}>
                <FiRefreshCw size={14} aria-hidden /> Sync existing templates from Meta
              </button>
            ) : undefined
          }
        >
          Templates are pre-approved messages you need to start a conversation or send broadcasts. Create one here or sync the ones
          already in WhatsApp Manager.
        </EmptyState>
      ) : (
        <div className={d.tableWrap}>
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[#E8DCCB]">
                <th className={d.th}>Name</th>
                <th className={d.th}>Category</th>
                <th className={d.th}>Language</th>
                <th className={d.th}>Status</th>
                <th className={d.th}>Quality</th>
                <th className={d.th}>Updated</th>
                <th className={`${d.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !items.length ? (
                <tr>
                  <td className={d.td} colSpan={7}>Loading…</td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} className={`${d.trBorder} hover:bg-[#FAF7F2]`}>
                    <td className={d.td}>
                      <button type="button" className="text-left font-medium text-[#2E2E2E] hover:underline" onClick={() => setViewing(t)}>
                        {t.name}
                      </button>
                      {t.status === 'REJECTED' && t.rejectedReason ? (
                        <p className="mt-0.5 text-xs text-[#D96B6B]">{t.rejectedReason.replace(/_/g, ' ').toLowerCase()}</p>
                      ) : null}
                    </td>
                    <td className={d.td}><CategoryBadge category={t.category} /></td>
                    <td className={d.td}>{t.language}</td>
                    <td className={d.td}><TemplateStatusBadge status={t.status} /></td>
                    <td className={d.td}><QualityBadge score={t.qualityScore} /></td>
                    <td className={`${d.td} whitespace-nowrap text-[#8B7355]`}>{fmtDateTime(t.updated_at)}</td>
                    <td className={`${d.td} text-right`}>
                      <div className="inline-flex gap-1">
                        {perms.send && t.status === 'APPROVED' ? (
                          <button type="button" className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]" title="Send test message" aria-label={`Send ${t.name}`} onClick={() => setSendingWith(t)} disabled={!configured}>
                            <FiSend size={16} />
                          </button>
                        ) : null}
                        {perms.templates ? (
                          <button type="button" className="rounded p-2 text-[#D96B6B] hover:bg-[#D96B6B]/10" title="Delete template" aria-label={`Delete ${t.name}`} onClick={() => setDeleting(t)} disabled={!configured}>
                            <FiTrash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <TemplateEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onCreated={() => void load()}
        mediaUploadEnabled={Boolean(status?.headerMediaUploadEnabled)}
      />

      <Modal open={Boolean(viewing)} title={viewing ? `${viewing.name} · ${viewing.language}` : ''} onClose={() => setViewing(null)}>
        {viewing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <TemplateStatusBadge status={viewing.status} />
              <CategoryBadge category={viewing.category} />
              <QualityBadge score={viewing.qualityScore} />
            </div>
            <TemplatePreview components={viewing.components} />
            {viewing.metaTemplateId ? <p className="text-xs text-[#8B7355]">Meta template ID: {viewing.metaTemplateId}</p> : null}
          </div>
        ) : null}
      </Modal>

      <SendTemplateModal open={Boolean(sendingWith)} onClose={() => setSendingWith(null)} initialTemplateId={sendingWith?.id} />

      <ConfirmModal
        open={Boolean(deleting)}
        title="Delete template?"
        message={
          deleting
            ? `"${deleting.name}" (${deleting.language}) will be deleted from WhatsApp Manager too. Meta won't let you reuse this name for 30 days.`
            : ''
        }
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

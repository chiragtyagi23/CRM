import type { ReactNode } from 'react'
import { FiAlertTriangle, FiCheck, FiClock, FiExternalLink, FiPhone, FiCopy, FiCornerUpLeft } from 'react-icons/fi'

import type { WaMessageStatus, WaTemplateComponent } from '../../lib/whatsappApi'
import { describeInputs, findComponent, formatWhatsAppText, substitute } from '../../lib/whatsappTemplates'
import { d } from '../../lib/designClasses'

const pill = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold'

const TEMPLATE_STATUS_CLASS: Record<string, string> = {
  APPROVED: 'bg-[#6FAF8F]/20 text-[#3f8a64]',
  PENDING: 'bg-[#E8DCCB] text-[#8B7355]',
  IN_APPEAL: 'bg-[#E8DCCB] text-[#8B7355]',
  REJECTED: 'bg-[#D96B6B]/20 text-[#D96B6B]',
  PAUSED: 'bg-[#F2C94C]/25 text-[#8a6d00]',
  DISABLED: 'bg-[#2E2E2E]/10 text-[#2E2E2E]',
}

export function TemplateStatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ').toLowerCase()
  return <span className={`${pill} capitalize ${TEMPLATE_STATUS_CLASS[status] ?? 'bg-[#F5EFE7] text-[#8B7355]'}`}>{label}</span>
}

export function CategoryBadge({ category }: { category: string }) {
  return <span className={`${pill} bg-[#F5EFE7] capitalize text-[#8B7355]`}>{category.toLowerCase()}</span>
}

const QUALITY: Record<string, { label: string; cls: string }> = {
  GREEN: { label: 'High', cls: 'bg-[#6FAF8F]/20 text-[#3f8a64]' },
  YELLOW: { label: 'Medium', cls: 'bg-[#F2C94C]/25 text-[#8a6d00]' },
  RED: { label: 'Low', cls: 'bg-[#D96B6B]/20 text-[#D96B6B]' },
}

export function QualityBadge({ score }: { score: string | null | undefined }) {
  const q = score ? QUALITY[String(score).toUpperCase()] : undefined
  if (!q) return <span className={`${pill} bg-[#F5EFE7] text-[#8B7355]`}>Unknown</span>
  return <span className={`${pill} ${q.cls}`}>{q.label}</span>
}

/** WhatsApp-style ticks: one grey (sent), two grey (delivered), two blue (read). */
export function MessageTicks({ status, error }: { status: WaMessageStatus; error?: string }) {
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 text-[#D96B6B]" title={error || 'Failed'}>
        <FiAlertTriangle size={12} aria-hidden /> <span className="text-[10px]">Failed</span>
      </span>
    )
  }
  if (status === 'accepted') return <FiClock size={12} className="text-[#8696a0]" aria-label="Sending" />
  const blue = status === 'read'
  const color = blue ? 'text-[#53bdeb]' : 'text-[#8696a0]'
  if (status === 'sent') return <FiCheck size={13} className={color} aria-label="Sent" />
  return (
    <span className={`relative inline-block h-[13px] w-[18px] ${color}`} aria-label={blue ? 'Read' : 'Delivered'}>
      <FiCheck size={13} className="absolute left-0 top-0" />
      <FiCheck size={13} className="absolute left-[5px] top-0" />
    </span>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={`${d.cardP6} text-center`}>
      <p className="text-base font-semibold text-[#2E2E2E]">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-xl text-sm text-[#8B7355]">{children}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error'; children: ReactNode }) {
  const cls =
    tone === 'error'
      ? 'border-[#D96B6B]/40 bg-[#D96B6B]/10 text-[#9c3d3d]'
      : tone === 'warn'
        ? 'border-[#F2C94C]/60 bg-[#F2C94C]/15 text-[#6b5500]'
        : 'border-[#8B7355]/20 bg-[#F5EFE7] text-[#6d5a43]'
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>
}

function ButtonIcon({ type }: { type: string }) {
  if (type === 'URL') return <FiExternalLink size={14} aria-hidden />
  if (type === 'PHONE_NUMBER') return <FiPhone size={14} aria-hidden />
  if (type === 'COPY_CODE' || type === 'OTP') return <FiCopy size={14} aria-hidden />
  return <FiCornerUpLeft size={14} aria-hidden />
}

/** Phone-style preview of a template, with variables substituted where values are known. */
export function TemplatePreview({
  components,
  values,
  headerMediaUrl,
}: {
  components: WaTemplateComponent[]
  values?: { header?: string[]; body?: string[] }
  headerMediaUrl?: string
}) {
  const inputs = describeInputs({ components })
  const header = findComponent(components, 'HEADER')
  const body = findComponent(components, 'BODY')
  const footer = findComponent(components, 'FOOTER')
  const buttons = findComponent(components, 'BUTTONS')?.buttons ?? []

  const headerText = substitute(header?.text, inputs.headerVariables, values?.header)
  const bodyText = substitute(body?.text, inputs.bodyVariables, values?.body)

  return (
    <div className="rounded-xl bg-[#EFE7DD] p-4" aria-label="Message preview">
      <div className="max-w-[320px] overflow-hidden rounded-lg bg-white shadow-sm">
        {inputs.needsHeaderMedia ? (
          headerMediaUrl && inputs.headerFormat === 'IMAGE' ? (
            <img src={headerMediaUrl} alt="" className="h-40 w-full object-cover" />
          ) : (
            <div className="flex h-32 items-center justify-center bg-[#dfe5e7] text-xs font-semibold uppercase tracking-wider text-[#54656f]">
              {inputs.headerFormat?.toLowerCase()}
            </div>
          )
        ) : null}
        <div className="px-3 pb-2 pt-2">
          {header && inputs.headerFormat === 'TEXT' && headerText ? (
            <p className="mb-1 text-[15px] font-semibold text-[#111b21]">{headerText}</p>
          ) : null}
          {bodyText ? (
            <p
              className="whitespace-pre-wrap break-words text-[14px] leading-[19px] text-[#111b21]"
              dangerouslySetInnerHTML={{ __html: formatWhatsAppText(bodyText) }}
            />
          ) : (
            <p className="text-[14px] italic text-[#8696a0]">Message body</p>
          )}
          {footer?.text ? <p className="mt-1 text-[13px] text-[#8696a0]">{footer.text}</p> : null}
          <p className="mt-0.5 text-right text-[11px] text-[#8696a0]">12:00</p>
        </div>
        {buttons.length ? (
          <div className="divide-y divide-[#e9edef] border-t border-[#e9edef]">
            {buttons.map((b, i) => (
              <div key={i} className="flex items-center justify-center gap-2 py-2 text-[14px] font-medium text-[#00a5f4]">
                <ButtonIcon type={b.type} />
                {b.type === 'OTP' ? 'Copy code' : b.text || 'Button'}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className={d.label}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-[#8B7355]/80">{hint}</span> : null}
    </label>
  )
}

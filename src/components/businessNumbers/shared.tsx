import { FiMessageSquare, FiPhone } from 'react-icons/fi'

import { d } from '../../lib/designClasses'
import type { BnStatus } from '../../lib/businessNumbersApi'

export function Capabilities({ voice, sms }: { voice: boolean; sms: boolean }) {
  const chip = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'
  return (
    <span className="inline-flex flex-wrap gap-1">
      {voice ? (
        <span className={`${chip} bg-[#F5EFE7] text-[#6d5a43]`}>
          <FiPhone size={11} aria-hidden /> Voice
        </span>
      ) : null}
      {sms ? (
        <span className={`${chip} bg-[#F5EFE7] text-[#6d5a43]`}>
          <FiMessageSquare size={11} aria-hidden /> SMS
        </span>
      ) : null}
      {!voice && !sms ? <span className="text-xs text-[#8B7355]">—</span> : null}
    </span>
  )
}

export function StatusBadge({ status }: { status: BnStatus }) {
  if (status === 'pending') return <span className={d.badgeWarm} title="Being activated — usually takes a few minutes, sometimes up to a few days">Activating</span>
  if (status === 'released') return <span className={d.badgeCold}>Released</span>
  return <span className={d.badgeWon}>Active</span>
}

import type { DashboardStatDTO } from '../lib/dashboardDummyApi'
import { FiMapPin, FiPhone, FiTarget, FiUsers } from 'react-icons/fi'

function StatIcon({ name }: { name: DashboardStatDTO['icon'] }) {
  const cls = 'h-[18px] w-[18px]'
  switch (name) {
    case 'target':
      return <FiTarget className={cls} aria-hidden />
    case 'phone':
      return <FiPhone className={cls} aria-hidden />
    case 'pin':
      return <FiMapPin className={cls} aria-hidden />
    default:
      return <FiUsers className={cls} aria-hidden />
  }
}

const iconColors: Record<DashboardStatDTO['icon'], string> = {
  users: '#8B7355',
  target: '#D96B6B',
  phone: '#6FAF8F',
  pin: '#8B7355',
}

type Props = {
  stat: DashboardStatDTO
}

export function DashboardStatCard({ stat }: Props) {
  const color = iconColors[stat.icon] ?? '#8B7355'

  return (
    <article className="crm-stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#8B7355] mb-1">{stat.label}</p>
          <p className="text-3xl font-semibold text-[#2E2E2E]">{stat.value}</p>
          {stat.trend ? (
            <p className="mt-2 text-sm text-[#6FAF8F] font-medium">{stat.trend.label}</p>
          ) : null}
        </div>
        <div
          className="p-3 rounded-lg shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
          aria-hidden
        >
          <StatIcon name={stat.icon} />
        </div>
      </div>
    </article>
  )
}

import type { DashboardStatDTO } from '../lib/dashboardDummyApi'

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M6.5 8.25a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm7.2 0a2.55 2.55 0 1 1 0-5.1 2.55 2.55 0 0 1 0 5.1zM1.75 16c0-3 2.55-5.4 5.7-5.4s5.7 2.4 5.7 5.4v.5H1.75V16zm10.55.5V16c0-1.35-.48-2.58-1.28-3.54.55-.27 1.18-.41 1.87-.41 2.4 0 4.36 1.76 4.36 3.95v.5h-4.95z"
      />
    </svg>
  )
}

function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 1.75a7.25 7.25 0 1 0 0 14.5 7.25 7.25 0 0 0 0-14.5zm0 2a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 2.15a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm0 2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"
      />
    </svg>
  )
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M5.45 2.25h2.05c.38 0 .7.27.76.64l.38 2.3c.06.37-.16.73-.52.84l-1.56.5c.37.87.98 1.82 1.76 2.6.78.78 1.73 1.39 2.6 1.76l.5-1.56c.11-.36.47-.58.84-.52l2.3.38c.37.06.64.38.64.76v2.05c0 .42-.32.76-.74.8-1.2.1-3.64-.02-6.22-2.6-2.58-2.58-2.7-5.02-2.6-6.22.04-.42.38-.74.8-.74z"
      />
    </svg>
  )
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.25a4.25 4.25 0 0 0-4.25 4.15c0 3.2 3.5 7.85 4.25 8.85.75-1 4.25-5.65 4.25-8.85A4.25 4.25 0 0 0 9 2.25zm0 5.5a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7z"
      />
    </svg>
  )
}

function TrendArrow({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        fill="currentColor"
        d="M11.65 4.15a.75.75 0 0 1 0 1.06l-4.7 4.7a.75.75 0 0 1-1.06 0L3.5 7.52l-.9.9a.75.75 0 1 1-1.06-1.06l1.43-1.43a.75.75 0 0 1 1.06 0l2.39 2.39 4.17-4.17a.75.75 0 0 1 1.06 0z"
      />
    </svg>
  )
}

function StatIcon({ name }: { name: DashboardStatDTO['icon'] }) {
  switch (name) {
    case 'users':
      return <IconUsers />
    case 'target':
      return <IconTarget />
    case 'phone':
      return <IconPhone />
    case 'pin':
      return <IconPin />
    default:
      return <IconUsers />
  }
}

const iconWrapBase =
  'inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl [&_svg]:h-[18px] [&_svg]:w-[18px]'

function iconToneClass(icon: DashboardStatDTO['icon']): string {
  switch (icon) {
    case 'target':
      return `${iconWrapBase} bg-pink-400/25 text-pink-600`
    case 'phone':
      return `${iconWrapBase} bg-emerald-400/25 text-emerald-600`
    case 'pin':
    case 'users':
    default:
      return `${iconWrapBase} bg-[rgba(157,122,86,0.12)] text-[#8b6a47]`
  }
}

function trendClass(kind: NonNullable<DashboardStatDTO['trend']>['kind']): string {
  const base = 'mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold'
  switch (kind) {
    case 'up':
      return `${base} text-emerald-500`
    case 'down':
      return `${base} text-red-500`
    case 'neutral':
    default:
      return `${base} text-gray-300`
  }
}

type Props = {
  stat: DashboardStatDTO
}

export function DashboardStatCard({ stat }: Props) {
  return (
    <article className="min-h-[104px] rounded-2xl border border-gray-900/6 bg-white px-4 py-4 pb-3.5 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-gray-400">{stat.label}</div>
        <div className={iconToneClass(stat.icon)} aria-hidden>
          <StatIcon name={stat.icon} />
        </div>
      </div>
      <div className="mt-2.5 text-[30px] font-bold leading-none tracking-tight text-gray-900">{stat.value}</div>
      {stat.trend ? (
        <div className={trendClass(stat.trend.kind)}>
          {stat.trend.kind === 'up' ? <TrendArrow /> : null}
          <span>{stat.trend.label}</span>
        </div>
      ) : (
        <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300">
          <span>—</span>
        </div>
      )}
    </article>
  )
}

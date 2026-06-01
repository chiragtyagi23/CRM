/**
 * Tailwind class strings — match Lead Management System Design (Figma export).
 * Use these across pages so spacing, colors, and type stay identical.
 */
export const d = {
  pageWrap: 'w-full max-w-7xl mx-auto',
  pageWrapNarrow: 'w-full max-w-5xl mx-auto',
  pageWrapWide: 'w-full max-w-[1280px] mx-auto',

  pageHeader: 'mb-8',
  pageHeaderRow: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
  title: 'text-3xl font-semibold text-[#2E2E2E] mb-2',
  subtitle: 'text-[#8B7355]',

  card: 'bg-white rounded-xl border border-[#8B7355]/10',
  cardP4: 'bg-white rounded-xl p-4 border border-[#8B7355]/10',
  cardP5: 'bg-white rounded-xl p-5 border border-[#8B7355]/10',
  cardP6: 'bg-white rounded-xl p-6 border border-[#8B7355]/10',
  cardHover: 'bg-white rounded-xl p-6 border border-[#8B7355]/10 hover:shadow-lg transition-shadow',

  sectionTitle: 'text-xl font-semibold text-[#2E2E2E] mb-4',
  sectionLabel: 'text-sm font-medium text-[#8B7355] tracking-wider',

  btnPrimary:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#8B7355] text-white text-sm font-semibold hover:bg-[#6d5a43] transition-colors disabled:opacity-60',
  btnPrimarySm:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#8B7355] text-white text-sm font-semibold hover:bg-[#6d5a43] transition-colors disabled:opacity-60',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-[#8B7355] text-[#8B7355] text-sm font-semibold hover:bg-[#F5EFE7] transition-colors',
  btnSecondarySm:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#8B7355] text-[#8B7355] text-sm font-semibold hover:bg-[#F5EFE7] transition-colors',

  input:
    'w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-sm text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none',
  select:
    'w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-sm text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none',
  label: 'block text-sm font-medium text-[#8B7355] mb-2',

  gridStats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8',
  gridStats3: 'grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8',
  grid2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  gridCharts: 'grid grid-cols-1 gap-6 lg:grid-cols-2',

  rangeGroup: 'flex flex-wrap gap-2 mb-6',
  rangeActive: 'px-4 py-2 rounded-lg capitalize bg-[#8B7355] text-white transition-colors',
  rangeIdle:
    'px-4 py-2 rounded-lg capitalize bg-white text-[#8B7355] border border-[#8B7355]/20 hover:bg-[#F5EFE7] transition-colors',

  tableWrap: 'bg-white rounded-xl border border-[#8B7355]/10 overflow-x-auto',
  th: 'text-left py-4 px-6 text-sm font-medium text-[#8B7355]',
  td: 'py-4 px-6 text-[#2E2E2E] text-sm',
  trBorder: 'border-b border-[#E8DCCB] last:border-0',

  badgeHot: 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#D96B6B]/20 text-[#D96B6B]',
  badgeWarm: 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#E8DCCB] text-[#8B7355]',
  badgeCold: 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#F5EFE7] text-[#8B7355]',
  badgeWon: 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#6FAF8F]/20 text-[#6FAF8F]',

  muted: 'text-sm text-[#8B7355]',
  body: 'text-sm text-[#2E2E2E]',
  link: 'text-sm font-semibold text-[#8B7355] hover:text-[#2E2E2E] transition-colors',

  stack: 'space-y-6',
  stack4: 'space-y-4',
} as const

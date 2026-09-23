export type DashboardRange = 'overall' | 'today' | 'week' | 'month'

export type DashboardStatIconKey = 'users' | 'target' | 'phone' | 'pin'

export type DashboardStatTrendDTO = {
  kind: 'up' | 'neutral' | 'down'
  label: string
}

export type DashboardStatDTO = {
  id: string
  label: string
  value: number
  icon: DashboardStatIconKey
  trend: DashboardStatTrendDTO | null
}

export type SalesFunnelPointDTO = {
  stage: string
  value: number
}

export type LeadSourcePointDTO = {
  id: number
  label: string
  value: number
  color?: string
}

export type LeadScoreDTO = 'Hot' | 'Warm' | 'Cold'
export type LeadStatusDTO = 'New' | 'Contacted' | 'Qualified' | 'Opportunity' | 'Site Visit'

export type RecentLeadDTO = {
  id: string
  name: string
  contact: string
  source: string
  status: LeadStatusDTO
  score: LeadScoreDTO
  assignedTo: string
}

export type LeadDTO = RecentLeadDTO & {
  createdAtISO: string
  email: string
  budgetLabel: string
  bhkLabel: string
  locationLabel: string
  lastContactAtISO: string
  callbackDate?: string | null
  callbackTime?: string | null
  repeatCustomer: boolean
  sentiment: 'Positive' | 'Neutral' | 'Negative'
  timelineLabel: string
}

export type ReportsRange = 'week' | 'month' | 'quarter' | 'leads' | 'conversion' | 'team'

export type ReportsCardDTO = {
  id: 'totalLeads' | 'hotLeads' | 'conversionRate' | 'avgResponseTime'
  title: string
  value: string
  delta: string
  tone: 'sand' | 'rose' | 'mint' | 'amber'
}

export type ReportsSummaryResponse = {
  range: ReportsRange
  cards: ReportsCardDTO[]
}

export type TeamPerformanceRowDTO = {
  id: string
  name: string
  totalLeads: number
  hotLeads: number
  contacted: number
  closedWon: number
  conversionPct: number
}

export type TeamPerformanceResponse = {
  range: ReportsRange
  rows: TeamPerformanceRowDTO[]
}

export type ReportsConversionKpisDTO = {
  totalCallsMade: { value: number; note: string }
  siteVisitsCompleted: { value: number; note: string }
  dealsClosed: { value: number; note: string }
}

export type ReportsFunnelPointDTO = {
  label: string
  newLeads: number
  contacted: number
  qualified: number
  closedWon: number
}

export type ReportsStatusSliceDTO = {
  id: number
  label: string
  value: number
  color: string
}

export type ReportsChartsResponse = {
  range: ReportsRange
  funnel: ReportsFunnelPointDTO[]
  status: ReportsStatusSliceDTO[]
  sourcePerformance: {
    labels: string[]
    totalLeads: number[]
    hotLeads: number[]
    closedWon: number[]
  }
}

const DUMMY_REPORTS_BY_RANGE: Record<ReportsRange, ReportsSummaryResponse> = {
  week: {
    range: 'week',
    cards: [
      { id: 'totalLeads', title: 'Total Leads', value: '6', delta: '+15% from last period', tone: 'sand' },
      { id: 'hotLeads', title: 'Hot Leads', value: '3', delta: '+8% from last period', tone: 'rose' },
      { id: 'conversionRate', title: 'Conversion Rate', value: '21%', delta: '+3% from last period', tone: 'mint' },
      { id: 'avgResponseTime', title: 'Avg. Response Time', value: '2.6h', delta: '-10% from last period', tone: 'amber' },
    ],
  },
  month: {
    range: 'month',
    cards: [
      { id: 'totalLeads', title: 'Total Leads', value: '6', delta: '+15% from last period', tone: 'sand' },
      { id: 'hotLeads', title: 'Hot Leads', value: '3', delta: '+8% from last period', tone: 'rose' },
      { id: 'conversionRate', title: 'Conversion Rate', value: '23%', delta: '+5% from last period', tone: 'mint' },
      { id: 'avgResponseTime', title: 'Avg. Response Time', value: '2.3h', delta: '-12% from last period', tone: 'amber' },
    ],
  },
  quarter: {
    range: 'quarter',
    cards: [
      { id: 'totalLeads', title: 'Total Leads', value: '26', delta: '+18% from last period', tone: 'sand' },
      { id: 'hotLeads', title: 'Hot Leads', value: '11', delta: '+6% from last period', tone: 'rose' },
      { id: 'conversionRate', title: 'Conversion Rate', value: '24%', delta: '+2% from last period', tone: 'mint' },
      { id: 'avgResponseTime', title: 'Avg. Response Time', value: '2.1h', delta: '-15% from last period', tone: 'amber' },
    ],
  },
  leads: {
    range: 'leads',
    cards: [
      { id: 'totalLeads', title: 'Total Leads', value: '132', delta: '+9% from last period', tone: 'sand' },
      { id: 'hotLeads', title: 'Hot Leads', value: '37', delta: '+4% from last period', tone: 'rose' },
      { id: 'conversionRate', title: 'Conversion Rate', value: '19%', delta: '+1% from last period', tone: 'mint' },
      { id: 'avgResponseTime', title: 'Avg. Response Time', value: '2.4h', delta: '-5% from last period', tone: 'amber' },
    ],
  },
  conversion: {
    range: 'conversion',
    cards: [
      { id: 'totalLeads', title: 'Total Leads', value: '84', delta: '+7% from last period', tone: 'sand' },
      { id: 'hotLeads', title: 'Hot Leads', value: '29', delta: '+3% from last period', tone: 'rose' },
      { id: 'conversionRate', title: 'Conversion Rate', value: '27%', delta: '+6% from last period', tone: 'mint' },
      { id: 'avgResponseTime', title: 'Avg. Response Time', value: '2.2h', delta: '-9% from last period', tone: 'amber' },
    ],
  },
  team: {
    range: 'team',
    cards: [
      { id: 'totalLeads', title: 'Total Leads', value: '64', delta: '+11% from last period', tone: 'sand' },
      { id: 'hotLeads', title: 'Hot Leads', value: '18', delta: '+2% from last period', tone: 'rose' },
      { id: 'conversionRate', title: 'Conversion Rate', value: '22%', delta: '+4% from last period', tone: 'mint' },
      { id: 'avgResponseTime', title: 'Avg. Response Time', value: '2.5h', delta: '-8% from last period', tone: 'amber' },
    ],
  },
}

const DUMMY_TEAM_PERFORMANCE_BY_RANGE: Record<ReportsRange, TeamPerformanceResponse> = {
  week: {
    range: 'week',
    rows: [
      { id: 'tp_priya', name: 'Priya Sharma', totalLeads: 3, hotLeads: 2, contacted: 3, closedWon: 0, conversionPct: 0 },
      { id: 'tp_amit', name: 'Amit Patel', totalLeads: 2, hotLeads: 1, contacted: 1, closedWon: 0, conversionPct: 0 },
      { id: 'tp_vikram', name: 'Vikram Singh', totalLeads: 1, hotLeads: 0, contacted: 1, closedWon: 0, conversionPct: 0 },
    ],
  },
  month: {
    range: 'month',
    rows: [
      { id: 'tp_priya', name: 'Priya Sharma', totalLeads: 12, hotLeads: 6, contacted: 10, closedWon: 2, conversionPct: 17 },
      { id: 'tp_amit', name: 'Amit Patel', totalLeads: 9, hotLeads: 3, contacted: 7, closedWon: 1, conversionPct: 11 },
      { id: 'tp_vikram', name: 'Vikram Singh', totalLeads: 8, hotLeads: 2, contacted: 6, closedWon: 1, conversionPct: 13 },
    ],
  },
  quarter: {
    range: 'quarter',
    rows: [
      { id: 'tp_priya', name: 'Priya Sharma', totalLeads: 38, hotLeads: 14, contacted: 31, closedWon: 7, conversionPct: 18 },
      { id: 'tp_amit', name: 'Amit Patel', totalLeads: 29, hotLeads: 9, contacted: 25, closedWon: 4, conversionPct: 14 },
      { id: 'tp_vikram', name: 'Vikram Singh', totalLeads: 27, hotLeads: 6, contacted: 22, closedWon: 4, conversionPct: 15 },
    ],
  },
  leads: {
    range: 'leads',
    rows: [
      { id: 'tp_priya', name: 'Priya Sharma', totalLeads: 22, hotLeads: 9, contacted: 18, closedWon: 3, conversionPct: 14 },
      { id: 'tp_amit', name: 'Amit Patel', totalLeads: 18, hotLeads: 6, contacted: 14, closedWon: 2, conversionPct: 11 },
      { id: 'tp_vikram', name: 'Vikram Singh', totalLeads: 16, hotLeads: 4, contacted: 13, closedWon: 2, conversionPct: 13 },
    ],
  },
  conversion: {
    range: 'conversion',
    rows: [
      { id: 'tp_priya', name: 'Priya Sharma', totalLeads: 19, hotLeads: 7, contacted: 16, closedWon: 4, conversionPct: 21 },
      { id: 'tp_amit', name: 'Amit Patel', totalLeads: 15, hotLeads: 4, contacted: 12, closedWon: 3, conversionPct: 20 },
      { id: 'tp_vikram', name: 'Vikram Singh', totalLeads: 14, hotLeads: 3, contacted: 11, closedWon: 2, conversionPct: 14 },
    ],
  },
  team: {
    range: 'team',
    rows: [
      { id: 'tp_priya', name: 'Priya Sharma', totalLeads: 3, hotLeads: 2, contacted: 3, closedWon: 0, conversionPct: 0 },
      { id: 'tp_amit', name: 'Amit Patel', totalLeads: 2, hotLeads: 1, contacted: 1, closedWon: 0, conversionPct: 0 },
      { id: 'tp_vikram', name: 'Vikram Singh', totalLeads: 1, hotLeads: 0, contacted: 1, closedWon: 0, conversionPct: 0 },
    ],
  },
}

const DUMMY_REPORTS_CONVERSION_KPIS_BY_RANGE: Record<ReportsRange, ReportsConversionKpisDTO> = {
  week: {
    totalCallsMade: { value: 142, note: 'Average 35 calls/week' },
    siteVisitsCompleted: { value: 28, note: '85% attendance rate' },
    dealsClosed: { value: 14, note: '₹12.5 Cr total value' },
  },
  month: {
    totalCallsMade: { value: 612, note: 'Average 153 calls/week' },
    siteVisitsCompleted: { value: 96, note: '82% attendance rate' },
    dealsClosed: { value: 41, note: '₹31.8 Cr total value' },
  },
  quarter: {
    totalCallsMade: { value: 1880, note: 'Average 157 calls/week' },
    siteVisitsCompleted: { value: 281, note: '80% attendance rate' },
    dealsClosed: { value: 119, note: '₹92.4 Cr total value' },
  },
  leads: {
    totalCallsMade: { value: 402, note: 'Average 101 calls/week' },
    siteVisitsCompleted: { value: 64, note: '83% attendance rate' },
    dealsClosed: { value: 22, note: '₹18.7 Cr total value' },
  },
  conversion: {
    totalCallsMade: { value: 142, note: 'Average 35 calls/week' },
    siteVisitsCompleted: { value: 28, note: '85% attendance rate' },
    dealsClosed: { value: 14, note: '₹12.5 Cr total value' },
  },
  team: {
    totalCallsMade: { value: 142, note: 'Average 35 calls/week' },
    siteVisitsCompleted: { value: 28, note: '85% attendance rate' },
    dealsClosed: { value: 14, note: '₹12.5 Cr total value' },
  },
}

const REPORTS_STATUS_COLORS: Record<string, string> = {
  New: '#d96a6a',
  Contacted: '#efe8de',
  Qualified: '#e9decf',
  Opportunity: '#7b6348',
  Negotiation: '#a08b6f',
  'Site Visit': '#6aa88a',
}

const DUMMY_REPORTS_CHARTS_BY_RANGE: Record<ReportsRange, ReportsChartsResponse> = {
  week: {
    range: 'week',
    funnel: [
      { label: 'Week 1', newLeads: 12, contacted: 10, qualified: 8, closedWon: 2 },
      { label: 'Week 2', newLeads: 15, contacted: 13, qualified: 10, closedWon: 3 },
      { label: 'Week 3', newLeads: 18, contacted: 15, qualified: 12, closedWon: 4 },
      { label: 'Week 4', newLeads: 20, contacted: 18, qualified: 14, closedWon: 5 },
    ],
    status: [
      { id: 1, label: 'New', value: 17, color: REPORTS_STATUS_COLORS.New },
      { id: 2, label: 'Contacted', value: 17, color: REPORTS_STATUS_COLORS.Contacted },
      { id: 3, label: 'Qualified', value: 17, color: REPORTS_STATUS_COLORS.Qualified },
      { id: 4, label: 'Opportunity', value: 17, color: REPORTS_STATUS_COLORS.Opportunity },
      { id: 5, label: 'Negotiation', value: 17, color: REPORTS_STATUS_COLORS.Negotiation },
      { id: 6, label: 'Site Visit', value: 17, color: REPORTS_STATUS_COLORS['Site Visit'] },
    ],
    sourcePerformance: {
      labels: ['99acres', 'MagicBricks', 'Facebook', 'Website', 'Walk-in', 'QR Code'],
      totalLeads: [6, 5, 4, 5, 3, 6],
      hotLeads: [3, 3, 2, 2, 1, 3],
      closedWon: [1, 1, 0, 1, 0, 1],
    },
  },
  month: {
    range: 'month',
    funnel: [
      { label: 'Week 1', newLeads: 10, contacted: 8, qualified: 6, closedWon: 2 },
      { label: 'Week 2', newLeads: 13, contacted: 11, qualified: 10, closedWon: 3 },
      { label: 'Week 3', newLeads: 15, contacted: 13, qualified: 12, closedWon: 4 },
      { label: 'Week 4', newLeads: 18, contacted: 16, qualified: 14, closedWon: 5 },
    ],
    status: [
      { id: 1, label: 'New', value: 14, color: REPORTS_STATUS_COLORS.New },
      { id: 2, label: 'Contacted', value: 18, color: REPORTS_STATUS_COLORS.Contacted },
      { id: 3, label: 'Qualified', value: 18, color: REPORTS_STATUS_COLORS.Qualified },
      { id: 4, label: 'Opportunity', value: 16, color: REPORTS_STATUS_COLORS.Opportunity },
      { id: 5, label: 'Negotiation', value: 16, color: REPORTS_STATUS_COLORS.Negotiation },
      { id: 6, label: 'Site Visit', value: 18, color: REPORTS_STATUS_COLORS['Site Visit'] },
    ],
    sourcePerformance: {
      labels: ['99acres', 'MagicBricks', 'Facebook', 'Website', 'Walk-in', 'QR Code'],
      totalLeads: [24, 19, 16, 21, 12, 18],
      hotLeads: [11, 8, 6, 9, 4, 7],
      closedWon: [4, 3, 2, 3, 1, 2],
    },
  },
  quarter: {
    range: 'quarter',
    funnel: [
      { label: 'Week 1', newLeads: 9, contacted: 7, qualified: 6, closedWon: 1 },
      { label: 'Week 2', newLeads: 12, contacted: 10, qualified: 8, closedWon: 2 },
      { label: 'Week 3', newLeads: 16, contacted: 14, qualified: 11, closedWon: 3 },
      { label: 'Week 4', newLeads: 21, contacted: 18, qualified: 15, closedWon: 5 },
    ],
    status: [
      { id: 1, label: 'New', value: 16, color: REPORTS_STATUS_COLORS.New },
      { id: 2, label: 'Contacted', value: 18, color: REPORTS_STATUS_COLORS.Contacted },
      { id: 3, label: 'Qualified', value: 17, color: REPORTS_STATUS_COLORS.Qualified },
      { id: 4, label: 'Opportunity', value: 17, color: REPORTS_STATUS_COLORS.Opportunity },
      { id: 5, label: 'Negotiation', value: 15, color: REPORTS_STATUS_COLORS.Negotiation },
      { id: 6, label: 'Site Visit', value: 17, color: REPORTS_STATUS_COLORS['Site Visit'] },
    ],
    sourcePerformance: {
      labels: ['99acres', 'MagicBricks', 'Facebook', 'Website', 'Walk-in', 'QR Code'],
      totalLeads: [68, 54, 49, 61, 31, 52],
      hotLeads: [26, 21, 18, 24, 9, 19],
      closedWon: [12, 9, 7, 10, 3, 8],
    },
  },
  leads: {
    range: 'leads',
    funnel: [
      { label: 'Week 1', newLeads: 14, contacted: 11, qualified: 9, closedWon: 3 },
      { label: 'Week 2', newLeads: 16, contacted: 13, qualified: 11, closedWon: 4 },
      { label: 'Week 3', newLeads: 18, contacted: 15, qualified: 13, closedWon: 5 },
      { label: 'Week 4', newLeads: 22, contacted: 19, qualified: 15, closedWon: 6 },
    ],
    status: [
      { id: 1, label: 'New', value: 20, color: REPORTS_STATUS_COLORS.New },
      { id: 2, label: 'Contacted', value: 16, color: REPORTS_STATUS_COLORS.Contacted },
      { id: 3, label: 'Qualified', value: 14, color: REPORTS_STATUS_COLORS.Qualified },
      { id: 4, label: 'Opportunity', value: 18, color: REPORTS_STATUS_COLORS.Opportunity },
      { id: 5, label: 'Negotiation', value: 14, color: REPORTS_STATUS_COLORS.Negotiation },
      { id: 6, label: 'Site Visit', value: 18, color: REPORTS_STATUS_COLORS['Site Visit'] },
    ],
    sourcePerformance: {
      labels: ['99acres', 'MagicBricks', 'Facebook', 'Website', 'Walk-in', 'QR Code'],
      totalLeads: [44, 36, 29, 41, 18, 33],
      hotLeads: [20, 14, 11, 17, 6, 13],
      closedWon: [7, 5, 3, 6, 1, 4],
    },
  },
  conversion: {
    range: 'conversion',
    funnel: [
      { label: 'Week 1', newLeads: 11, contacted: 9, qualified: 7, closedWon: 2 },
      { label: 'Week 2', newLeads: 14, contacted: 12, qualified: 9, closedWon: 3 },
      { label: 'Week 3', newLeads: 17, contacted: 14, qualified: 11, closedWon: 4 },
      { label: 'Week 4', newLeads: 19, contacted: 16, qualified: 13, closedWon: 5 },
    ],
    status: [
      { id: 1, label: 'New', value: 15, color: REPORTS_STATUS_COLORS.New },
      { id: 2, label: 'Contacted', value: 15, color: REPORTS_STATUS_COLORS.Contacted },
      { id: 3, label: 'Qualified', value: 20, color: REPORTS_STATUS_COLORS.Qualified },
      { id: 4, label: 'Opportunity', value: 18, color: REPORTS_STATUS_COLORS.Opportunity },
      { id: 5, label: 'Negotiation', value: 17, color: REPORTS_STATUS_COLORS.Negotiation },
      { id: 6, label: 'Site Visit', value: 15, color: REPORTS_STATUS_COLORS['Site Visit'] },
    ],
    sourcePerformance: {
      labels: ['99acres', 'MagicBricks', 'Facebook', 'Website', 'Walk-in', 'QR Code'],
      totalLeads: [31, 26, 22, 28, 11, 21],
      hotLeads: [14, 11, 9, 12, 4, 9],
      closedWon: [6, 5, 4, 5, 1, 4],
    },
  },
  team: {
    range: 'team',
    funnel: [
      { label: 'Week 1', newLeads: 12, contacted: 10, qualified: 8, closedWon: 2 },
      { label: 'Week 2', newLeads: 15, contacted: 13, qualified: 10, closedWon: 3 },
      { label: 'Week 3', newLeads: 18, contacted: 15, qualified: 12, closedWon: 4 },
      { label: 'Week 4', newLeads: 20, contacted: 18, qualified: 14, closedWon: 5 },
    ],
    status: [
      { id: 1, label: 'New', value: 17, color: REPORTS_STATUS_COLORS.New },
      { id: 2, label: 'Contacted', value: 17, color: REPORTS_STATUS_COLORS.Contacted },
      { id: 3, label: 'Qualified', value: 17, color: REPORTS_STATUS_COLORS.Qualified },
      { id: 4, label: 'Opportunity', value: 17, color: REPORTS_STATUS_COLORS.Opportunity },
      { id: 5, label: 'Negotiation', value: 17, color: REPORTS_STATUS_COLORS.Negotiation },
      { id: 6, label: 'Site Visit', value: 17, color: REPORTS_STATUS_COLORS['Site Visit'] },
    ],
    sourcePerformance: {
      labels: ['99acres', 'MagicBricks', 'Facebook', 'Website', 'Walk-in', 'QR Code'],
      totalLeads: [6, 5, 4, 5, 3, 6],
      hotLeads: [3, 3, 2, 2, 1, 3],
      closedWon: [1, 1, 0, 1, 0, 1],
    },
  },
}

/** Simulates GET /api/reports/summary?range=… */
export function fetchReportsSummary(range: ReportsRange): Promise<ReportsSummaryResponse> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const data = DUMMY_REPORTS_BY_RANGE[range]
      resolve({
        range: data.range,
        cards: data.cards.map((c) => ({ ...c })),
      })
    }, 0)
  })
}

/** Simulates GET /api/reports/team-performance?range=… */
export function fetchTeamPerformance(range: ReportsRange): Promise<TeamPerformanceResponse> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const data = DUMMY_TEAM_PERFORMANCE_BY_RANGE[range]
      resolve({
        range: data.range,
        rows: data.rows.map((r) => ({ ...r })),
      })
    }, 0)
  })
}

/** Simulates GET /api/reports/charts?range=… */
export function fetchReportsCharts(range: ReportsRange): Promise<ReportsChartsResponse> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const data = DUMMY_REPORTS_CHARTS_BY_RANGE[range]
      resolve({
        range: data.range,
        funnel: data.funnel.map((p) => ({ ...p })),
        status: data.status.map((s) => ({ ...s })),
        sourcePerformance: {
          labels: [...data.sourcePerformance.labels],
          totalLeads: [...data.sourcePerformance.totalLeads],
          hotLeads: [...data.sourcePerformance.hotLeads],
          closedWon: [...data.sourcePerformance.closedWon],
        },
      })
    }, 0)
  })
}

/** Simulates GET /api/reports/conversion-kpis?range=… */
export function fetchReportsConversionKpis(range: ReportsRange): Promise<ReportsConversionKpisDTO> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const d = DUMMY_REPORTS_CONVERSION_KPIS_BY_RANGE[range]
      resolve({
        totalCallsMade: { ...d.totalCallsMade },
        siteVisitsCompleted: { ...d.siteVisitsCompleted },
        dealsClosed: { ...d.dealsClosed },
      })
    }, 0)
  })
}

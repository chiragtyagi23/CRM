export type DashboardRange = 'today' | 'week' | 'month'

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

export type DashboardSummaryResponse = {
  range: DashboardRange
  stats: DashboardStatDTO[]
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

export type DashboardChartsResponse = {
  range: DashboardRange
  salesFunnel: SalesFunnelPointDTO[]
  leadSources: LeadSourcePointDTO[]
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

export type DashboardRecentLeadsResponse = {
  range: DashboardRange
  items: RecentLeadDTO[]
}

export type LeadDTO = RecentLeadDTO & {
  createdAtISO: string
  email: string
  budgetLabel: string
  bhkLabel: string
  locationLabel: string
  lastContactAtISO: string
  repeatCustomer: boolean
  sentiment: 'Positive' | 'Neutral' | 'Negative'
  timelineLabel: string
}

export type LeadsResponse = {
  items: LeadDTO[]
}

export type SiteVisitsSummaryDTO = {
  totalVisits: number
  totalVisitsNote: string
  upcoming: number
  upcomingNote: string
  avgRating: number
  avgRatingNote: string
}

export type ProjectDTO = {
  id: string
  name: string
}

export type SiteVisitCreatePayload = {
  leadId: string
  projectId: string
  date: string
  time: string
  notes: string
}

export type SiteVisitDTO = {
  id: string
  leadName: string
  projectName: string
  visitDateTimeLabel: string
  tagPeriodDays: number
  progressPct: number
  expiresOnLabel: string
  daysLeftLabel: string
  ratingLabel: string
  locationLabel: string
  photosLabel: string
  feedback: string
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

export type ReportsFunnelSeriesKey = 'newLeads' | 'contacted' | 'qualified' | 'closedWon'

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
const DUMMY_PROJECTS: ProjectDTO[] = [
  { id: 'p1', name: 'Palm Residency' },
  { id: 'p2', name: 'Skyline Heights' },
  { id: 'p3', name: 'Harbor View' },
]

const DUMMY_SITE_VISITS_SUMMARY: SiteVisitsSummaryDTO = {
  totalVisits: 2,
  totalVisitsNote: 'This month',
  upcoming: 2,
  upcomingNote: 'Scheduled this week',
  avgRating: 4.5,
  avgRatingNote: 'Customer satisfaction',
}

const DUMMY_SITE_VISITS: SiteVisitDTO[] = [
  {
    id: 'sv1',
    leadName: 'Anita Desai',
    projectName: 'Sobha Dream Acres',
    visitDateTimeLabel: '3/31/2026, 11:00:00 AM',
    tagPeriodDays: 60,
    progressPct: 23,
    expiresOnLabel: '5/30/2026',
    daysLeftLabel: '46 days left',
    ratingLabel: '★ 5/5',
    locationLabel: '12.9352, 77.6245',
    photosLabel: '2 photos uploaded',
    feedback: 'Impressed with amenities and construction quality. Wants to visit again with family.',
  },
  {
    id: 'sv2',
    leadName: 'Rahul Mehta',
    projectName: 'Skyline Heights',
    visitDateTimeLabel: '4/10/2026, 05:30:00 PM',
    tagPeriodDays: 45,
    progressPct: 58,
    expiresOnLabel: '5/25/2026',
    daysLeftLabel: '32 days left',
    ratingLabel: '★ 4/5',
    locationLabel: '19.0760, 72.8777',
    photosLabel: '5 photos uploaded',
    feedback: 'Liked the sample flat and clubhouse. Requested pricing sheet and parking details.',
  },
]

let SITE_VISITS_STORE: SiteVisitDTO[] = DUMMY_SITE_VISITS.map((v) => ({ ...v }))

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

const DUMMY_SUMMARY_BY_RANGE: Record<DashboardRange, DashboardSummaryResponse> = {
  today: {
    range: 'today',
    stats: [
      {
        id: 'total_leads',
        label: 'Total Leads',
        value: 6,
        icon: 'users',
        trend: { kind: 'up', label: '+2 since yesterday' },
      },
      {
        id: 'hot_leads',
        label: 'Hot Leads',
        value: 3,
        icon: 'target',
        trend: { kind: 'up', label: '+1 new today' },
      },
      {
        id: 'contacted_today',
        label: 'Contacted Today',
        value: 0,
        icon: 'phone',
        trend: null,
      },
      {
        id: 'site_visits',
        label: 'Site Visits',
        value: 2,
        icon: 'pin',
        trend: { kind: 'up', label: '2 scheduled' },
      },
    ],
  },
  week: {
    range: 'week',
    stats: [
      {
        id: 'total_leads',
        label: 'Total Leads',
        value: 6,
        icon: 'users',
        trend: { kind: 'up', label: '+12% from last week' },
      },
      {
        id: 'hot_leads',
        label: 'Hot Leads',
        value: 3,
        icon: 'target',
        trend: { kind: 'up', label: '+5 new today' },
      },
      {
        id: 'contacted_today',
        label: 'Contacted Today',
        value: 0,
        icon: 'phone',
        trend: null,
      },
      {
        id: 'site_visits',
        label: 'Site Visits',
        value: 2,
        icon: 'pin',
        trend: { kind: 'up', label: '2 scheduled' },
      },
    ],
  },
  month: {
    range: 'month',
    stats: [
      {
        id: 'total_leads',
        label: 'Total Leads',
        value: 42,
        icon: 'users',
        trend: { kind: 'up', label: '+8% vs last month' },
      },
      {
        id: 'hot_leads',
        label: 'Hot Leads',
        value: 11,
        icon: 'target',
        trend: { kind: 'up', label: '+3 this week' },
      },
      {
        id: 'contacted_today',
        label: 'Contacted Today',
        value: 7,
        icon: 'phone',
        trend: { kind: 'up', label: '+18% vs avg' },
      },
      {
        id: 'site_visits',
        label: 'Site Visits',
        value: 14,
        icon: 'pin',
        trend: { kind: 'up', label: '9 scheduled' },
      },
    ],
  },
}

const DUMMY_CHARTS_BY_RANGE: Record<DashboardRange, DashboardChartsResponse> = {
  today: {
    range: 'today',
    salesFunnel: [
      { stage: 'New', value: 12 },
      { stage: 'Contacted', value: 9 },
      { stage: 'Qualified', value: 7 },
      { stage: 'Opportunity', value: 5 },
      { stage: 'Site Visit', value: 3 },
      { stage: 'Negotiation', value: 2 },
      { stage: 'Closed Won', value: 1 },
    ],
    leadSources: [
      { id: 0, value: 17, label: '99acres', color: '#80654a' },
      { id: 1, value: 17, label: 'QR Code', color: '#9b7a54' },
      { id: 2, value: 17, label: 'Walk-in', color: '#e07a79' },
      { id: 3, value: 17, label: 'Website', color: '#f3ede3' },
      { id: 4, value: 17, label: 'Facebook', color: '#e8dfd2' },
      { id: 5, value: 17, label: 'MagicBricks', color: '#6aa88b' },
    ],
  },
  week: {
    range: 'week',
    salesFunnel: [
      { stage: 'New', value: 28 },
      { stage: 'Contacted', value: 20 },
      { stage: 'Qualified', value: 16 },
      { stage: 'Opportunity', value: 12 },
      { stage: 'Site Visit', value: 8 },
      { stage: 'Negotiation', value: 5 },
      { stage: 'Closed Won', value: 3 },
    ],
    leadSources: [
      { id: 0, value: 17, label: '99acres', color: '#80654a' },
      { id: 1, value: 17, label: 'QR Code', color: '#9b7a54' },
      { id: 2, value: 17, label: 'Walk-in', color: '#e07a79' },
      { id: 3, value: 17, label: 'Website', color: '#f3ede3' },
      { id: 4, value: 17, label: 'Facebook', color: '#e8dfd2' },
      { id: 5, value: 17, label: 'MagicBricks', color: '#6aa88b' },
    ],
  },
  month: {
    range: 'month',
    salesFunnel: [
      { stage: 'New', value: 120 },
      { stage: 'Contacted', value: 92 },
      { stage: 'Qualified', value: 66 },
      { stage: 'Opportunity', value: 49 },
      { stage: 'Site Visit', value: 31 },
      { stage: 'Negotiation', value: 18 },
      { stage: 'Closed Won', value: 9 },
    ],
    leadSources: [
      { id: 0, value: 22, label: '99acres', color: '#80654a' },
      { id: 1, value: 18, label: 'QR Code', color: '#9b7a54' },
      { id: 2, value: 16, label: 'Walk-in', color: '#e07a79' },
      { id: 3, value: 15, label: 'Website', color: '#f3ede3' },
      { id: 4, value: 14, label: 'Facebook', color: '#e8dfd2' },
      { id: 5, value: 15, label: 'MagicBricks', color: '#6aa88b' },
    ],
  },
}

const DUMMY_RECENT_LEADS_BY_RANGE: Record<DashboardRange, DashboardRecentLeadsResponse> = {
  today: {
    range: 'today',
    items: [
      {
        id: 'lead_1',
        name: 'Rajesh Kumar',
        contact: '+91 98765 43210',
        source: '99acres',
        status: 'Opportunity',
        score: 'Hot',
        assignedTo: 'Priya Sharma',
      },
      {
        id: 'lead_2',
        name: 'Anita Desai',
        contact: '+91 87654 32109',
        source: 'MagicBricks',
        status: 'Site Visit',
        score: 'Hot',
        assignedTo: 'Amit Patel',
      },
      {
        id: 'lead_3',
        name: 'Mohammed Rizwan',
        contact: '+91 76543 21098',
        source: 'Facebook',
        status: 'Qualified',
        score: 'Warm',
        assignedTo: 'Priya Sharma',
      },
      {
        id: 'lead_4',
        name: 'Sneha Reddy',
        contact: '+91 65432 10987',
        source: 'Website',
        status: 'Contacted',
        score: 'Warm',
        assignedTo: 'Vikram Singh',
      },
      {
        id: 'lead_5',
        name: 'Karthik Iyer',
        contact: '+91 54321 09876',
        source: 'Walk-in',
        status: 'New',
        score: 'Cold',
        assignedTo: 'Amit Patel',
      },
    ],
  },
  week: {
    range: 'week',
    items: [
      {
        id: 'lead_1',
        name: 'Rajesh Kumar',
        contact: '+91 98765 43210',
        source: '99acres',
        status: 'Opportunity',
        score: 'Hot',
        assignedTo: 'Priya Sharma',
      },
      {
        id: 'lead_2',
        name: 'Anita Desai',
        contact: '+91 87654 32109',
        source: 'MagicBricks',
        status: 'Site Visit',
        score: 'Hot',
        assignedTo: 'Amit Patel',
      },
      {
        id: 'lead_3',
        name: 'Mohammed Rizwan',
        contact: '+91 76543 21098',
        source: 'Facebook',
        status: 'Qualified',
        score: 'Warm',
        assignedTo: 'Priya Sharma',
      },
      {
        id: 'lead_4',
        name: 'Sneha Reddy',
        contact: '+91 65432 10987',
        source: 'Website',
        status: 'Contacted',
        score: 'Warm',
        assignedTo: 'Vikram Singh',
      },
      {
        id: 'lead_5',
        name: 'Karthik Iyer',
        contact: '+91 54321 09876',
        source: 'Walk-in',
        status: 'New',
        score: 'Cold',
        assignedTo: 'Amit Patel',
      },
    ],
  },
  month: {
    range: 'month',
    items: [
      {
        id: 'lead_6',
        name: 'Neha Joshi',
        contact: '+91 99001 22334',
        source: 'Website',
        status: 'Qualified',
        score: 'Hot',
        assignedTo: 'Priya Sharma',
      },
      {
        id: 'lead_7',
        name: 'Arjun Mehta',
        contact: '+91 98989 12345',
        source: '99acres',
        status: 'Opportunity',
        score: 'Hot',
        assignedTo: 'Amit Patel',
      },
      {
        id: 'lead_8',
        name: 'Farah Khan',
        contact: '+91 91234 56789',
        source: 'Facebook',
        status: 'Contacted',
        score: 'Warm',
        assignedTo: 'Vikram Singh',
      },
      {
        id: 'lead_9',
        name: 'Sanjay Verma',
        contact: '+91 90000 11122',
        source: 'MagicBricks',
        status: 'Site Visit',
        score: 'Warm',
        assignedTo: 'Priya Sharma',
      },
      {
        id: 'lead_10',
        name: 'Isha Nair',
        contact: '+91 97777 66554',
        source: 'Walk-in',
        status: 'New',
        score: 'Cold',
        assignedTo: 'Amit Patel',
      },
    ],
  },
}

const DUMMY_LEADS: LeadsResponse = {
  items: [
    {
      id: 'lead_1',
      name: 'Rajesh Kumar',
      contact: '+91 98765 43210',
      email: 'rajesh.kumar@email.com',
      source: '99acres',
      status: 'Opportunity',
      score: 'Hot',
      assignedTo: 'Priya Sharma',
      createdAtISO: '2026-03-28T09:12:00.000Z',
      lastContactAtISO: '2026-03-30T09:10:00.000Z',
      budgetLabel: '75-85 Lakhs',
      bhkLabel: '3 BHK',
      locationLabel: 'Kharghar',
      repeatCustomer: false,
      sentiment: 'Positive',
      timelineLabel: '15-30 days',
    },
    {
      id: 'lead_2',
      name: 'Anita Desai',
      contact: '+91 87654 32109',
      email: 'anita.desai@email.com',
      source: 'MagicBricks',
      status: 'Site Visit',
      score: 'Hot',
      assignedTo: 'Amit Patel',
      createdAtISO: '2026-03-25T08:40:00.000Z',
      lastContactAtISO: '2026-03-31T08:55:00.000Z',
      budgetLabel: '1-1.2 Crores',
      bhkLabel: '4 BHK',
      locationLabel: 'Panvel',
      repeatCustomer: true,
      sentiment: 'Positive',
      timelineLabel: '30-45 days',
    },
    {
      id: 'lead_3',
      name: 'Mohammed Rizwan',
      contact: '+91 76543 21098',
      email: 'mohammed.rizwan@email.com',
      source: 'Facebook',
      status: 'Qualified',
      score: 'Warm',
      assignedTo: 'Priya Sharma',
      createdAtISO: '2026-04-13T16:20:00.000Z',
      lastContactAtISO: '2026-04-13T18:10:00.000Z',
      budgetLabel: '65-75 Lakhs',
      bhkLabel: '2 BHK',
      locationLabel: 'Belapur',
      repeatCustomer: false,
      sentiment: 'Neutral',
      timelineLabel: '30-60 days',
    },
    {
      id: 'lead_4',
      name: 'Sneha Reddy',
      contact: '+91 65432 10987',
      email: 'sneha.reddy@email.com',
      source: 'Website',
      status: 'Contacted',
      score: 'Warm',
      assignedTo: 'Vikram Singh',
      createdAtISO: '2026-04-13T12:05:00.000Z',
      lastContactAtISO: '2026-04-14T10:05:00.000Z',
      budgetLabel: '90 Lakhs - 1 Cr',
      bhkLabel: '3 BHK',
      locationLabel: 'Nerul',
      repeatCustomer: false,
      sentiment: 'Positive',
      timelineLabel: '15-30 days',
    },
    {
      id: 'lead_5',
      name: 'Karthik Iyer',
      contact: '+91 54321 09876',
      email: 'karthik.iyer@email.com',
      source: 'Walk-in',
      status: 'New',
      score: 'Cold',
      assignedTo: 'Amit Patel',
      createdAtISO: '2026-04-12T11:14:00.000Z',
      lastContactAtISO: '2026-04-12T11:14:00.000Z',
      budgetLabel: '45-55 Lakhs',
      bhkLabel: '2 BHK',
      locationLabel: 'Ulwe',
      repeatCustomer: false,
      sentiment: 'Neutral',
      timelineLabel: '60-90 days',
    },
  ],
}

/** Simulates GET /api/dashboard/summary?range=… */
export function fetchDashboardSummary(range: DashboardRange): Promise<DashboardSummaryResponse> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const data = DUMMY_SUMMARY_BY_RANGE[range]
      resolve({
        range: data.range,
        stats: data.stats.map((s) => ({
          ...s,
          trend: s.trend ? { ...s.trend } : null,
        })),
      })
    }, 0)
  })
}

/** Simulates GET /api/dashboard/charts?range=… */
export function fetchDashboardCharts(range: DashboardRange): Promise<DashboardChartsResponse> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const data = DUMMY_CHARTS_BY_RANGE[range]
      resolve({
        range: data.range,
        salesFunnel: data.salesFunnel.map((p) => ({ ...p })),
        leadSources: data.leadSources.map((p) => ({ ...p })),
      })
    }, 0)
  })
}

/** Simulates GET /api/leads/recent?range=… */
export function fetchRecentLeads(range: DashboardRange): Promise<DashboardRecentLeadsResponse> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const data = DUMMY_RECENT_LEADS_BY_RANGE[range]
      resolve({
        range: data.range,
        items: data.items.map((l) => ({ ...l })),
      })
    }, 0)
  })
}

/** Simulates GET /api/leads */
export function fetchLeads(): Promise<LeadsResponse> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({
        items: DUMMY_LEADS.items.map((l) => ({ ...l })),
      })
    }, 0)
  })
}

/** Simulates GET /api/leads/:id */
export function fetchLeadById(id: string): Promise<LeadDTO | null> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const found = DUMMY_LEADS.items.find((l) => l.id === id)
      resolve(found ? { ...found } : null)
    }, 0)
  })
}

/** Simulates GET /api/projects */
export function fetchProjects(): Promise<ProjectDTO[]> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(DUMMY_PROJECTS.map((p) => ({ ...p }))), 0)
  })
}

/** Simulates GET /api/site-visits/summary */
export function fetchSiteVisitsSummary(): Promise<SiteVisitsSummaryDTO> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const now = new Date()
      const upcoming = SITE_VISITS_STORE.filter((v) => {
        const d = new Date(v.visitDateTimeLabel)
        if (Number.isNaN(d.getTime())) return false
        return d.getTime() >= now.getTime()
      }).length
      resolve({
        totalVisits: SITE_VISITS_STORE.length,
        totalVisitsNote: DUMMY_SITE_VISITS_SUMMARY.totalVisitsNote,
        upcoming,
        upcomingNote: DUMMY_SITE_VISITS_SUMMARY.upcomingNote,
        avgRating: DUMMY_SITE_VISITS_SUMMARY.avgRating,
        avgRatingNote: DUMMY_SITE_VISITS_SUMMARY.avgRatingNote,
      })
    }, 0)
  })
}

/** Simulates POST /api/site-visits */
export function createSiteVisit(payload: SiteVisitCreatePayload): Promise<{ ok: true; id: string }> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const lead = DUMMY_LEADS.items.find((l) => l.id === payload.leadId)
      const project = DUMMY_PROJECTS.find((p) => p.id === payload.projectId)
      const id = `sv_${Math.random().toString(16).slice(2, 10)}`

      const visitDateTimeLabel = `${payload.date}, ${payload.time}`
      const tagPeriodDays = 60
      const expiresOnLabel = payload.date
      const daysLeftLabel = `${tagPeriodDays} days left`

      const created: SiteVisitDTO = {
        id,
        leadName: lead?.name ?? 'Unknown Lead',
        projectName: project?.name ?? 'Unknown Project',
        visitDateTimeLabel,
        tagPeriodDays,
        progressPct: 0,
        expiresOnLabel,
        daysLeftLabel,
        ratingLabel: '★ 0/5',
        locationLabel: lead?.locationLabel ?? '—',
        photosLabel: '0 photos uploaded',
        feedback: payload.notes?.trim().length ? payload.notes : 'Visit scheduled.',
      }

      SITE_VISITS_STORE = [created, ...SITE_VISITS_STORE]
      resolve({ ok: true, id })
    }, 300)
  })
}

/** Simulates GET /api/site-visits */
export function fetchSiteVisits(): Promise<SiteVisitDTO[]> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(SITE_VISITS_STORE.map((v) => ({ ...v }))), 0)
  })
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

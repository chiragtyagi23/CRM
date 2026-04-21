import type { DashboardRange, DashboardStatDTO } from '../lib/dashboardDummyApi'

export function buildDashboardStats(totalLeads: number, hotLeads: number, contactedToday: number, siteVisits: number): DashboardStatDTO[] {
  return [
    { id: 'total_leads', label: 'Total Leads', value: totalLeads, icon: 'users', trend: null },
    { id: 'hot_leads', label: 'Hot Leads', value: hotLeads, icon: 'target', trend: null },
    { id: 'contacted_today', label: 'Contacted Today', value: contactedToday, icon: 'phone', trend: null },
    { id: 'site_visits', label: 'Site Visits', value: siteVisits, icon: 'pin', trend: null },
  ]
}

export function dashboardSubtitle(range: DashboardRange) {
  switch (range) {
    case 'today':
      return "Welcome back! Here's your lead management overview for today."
    case 'month':
      return "Welcome back! Here's your lead management overview for this month."
    case 'week':
    default:
      return "Welcome back! Here's your lead management overview."
  }
}


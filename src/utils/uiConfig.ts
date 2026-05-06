import type { IconType } from 'react-icons'
import { FaFacebook, FaGlobe, FaQrcode } from 'react-icons/fa'
import { MdPeopleAlt } from 'react-icons/md'
import { FaBookmark, FaHouse } from 'react-icons/fa6'

import type { DashboardRange, DashboardStatDTO } from '../lib/dashboardDummyApi'

export function buildDashboardStats(
  totalLeads: number,
  hotLeads: number,
  contactedToday: number,
  siteVisits: number,
): DashboardStatDTO[] {
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

export type CaptureLeadSourceId =
  | '99acres'
  | 'magicbricks'
  | 'housing'
  | 'facebook'
  | 'website'
  | 'qrcode'
  | 'walkin'

export type CaptureLeadSourceTileOption = {
  id: CaptureLeadSourceId
  label: string
  icon: IconType
  tone: 'sand' | 'mint' | 'slate' | 'rose'
}

export const CAPTURE_LEAD_SOURCE_TILE_OPTIONS: CaptureLeadSourceTileOption[] = [
  {
    id: '99acres',
    label: '99acres',
    icon: FaGlobe,
    tone: 'sand',
  },
  {
    id: 'magicbricks',
    label: 'MagicBricks',
    icon: FaBookmark,
    tone: 'mint',
  },
  {
    id: 'housing',
    label: 'Housing.com',
    icon: FaHouse,
    tone: 'slate',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: FaFacebook,
    tone: 'sand',
  },
  {
    id: 'website',
    label: 'Website',
    icon: FaGlobe,
    tone: 'mint',
  },
  {
    id: 'qrcode',
    label: 'QR Code',
    icon: FaQrcode,
    tone: 'rose',
  },
  {
    id: 'walkin',
    label: 'Walk-in',
    icon: MdPeopleAlt,
    tone: 'slate',
  },
]

export const PREFERRED_LOCATIONS = [
  'KHARGHAR',
  'UPPER KHARGHAR',
  'NERUL',
  'TALOJA',
  'PANVEL',
  'KARJAT',
  'VASHI',
  'GHANSOLI',
] as const

export const PREFERRED_LOCATION_OTHER_VALUE = '__other__'

export const OWNERSHIP_TOGGLE_OPTIONS = [
  { value: 'RENTED' as const, label: 'RENTED' },
  { value: 'OWNED' as const, label: 'OWNED' },
]

export const WORK_PROFILE_TOGGLE_OPTIONS = [
  { value: 'SERVICE' as const, label: 'SERVICE' },
  { value: 'BUSINESS' as const, label: 'BUSINESS' },
]

export const LEAD_STATUS_OPTIONS = ['HOT', 'WARM', 'COLD'] as const

export const BUYING_STAGE_OPTIONS = [
  'SEARCHING',
  'ADVANCED',
  'SHORTLISTED',
  'TOKEN',
  'BOOKED',
  'LOST',
] as const

export const BHK_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: '1 BHK', label: '1 BHK' },
  { value: '2 BHK', label: '2 BHK' },
  { value: '3 BHK', label: '3 BHK' },
  { value: '4 BHK', label: '4 BHK' },
]

export const BUDGET_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: '45-55 Lakhs', label: '45-55 Lakhs' },
  { value: '65-75 Lakhs', label: '65-75 Lakhs' },
  { value: '75-85 Lakhs', label: '75-85 Lakhs' },
  { value: '90 Lakhs - 1 Cr', label: '90 Lakhs - 1 Cr' },
  { value: '1-1.2 Crores', label: '1-1.2 Crores' },
]

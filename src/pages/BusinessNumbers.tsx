import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiList, FiPhone, FiPlusCircle, FiSearch } from 'react-icons/fi'

import { PageHeader } from '../components/PageHeader'
import { MyNumbersTab } from '../components/businessNumbers/MyNumbersTab'
import { GetNumberTab } from '../components/businessNumbers/GetNumberTab'
import { AllNumbersTab, UnassignedTab } from '../components/businessNumbers/AdminTabs'
import { getApiErrorMessage } from '../services/aclHttp'
import { businessNumbersApi, type BnOverview } from '../lib/businessNumbersApi'

const TABS = [
  { id: 'mine', label: 'My numbers', icon: FiPhone, managerOnly: false },
  { id: 'get', label: 'Get a number', icon: FiPlusCircle, managerOnly: false },
  { id: 'all', label: 'All numbers', icon: FiList, managerOnly: true },
  { id: 'unassigned', label: 'Account check', icon: FiSearch, managerOnly: true },
] as const

type TabId = (typeof TABS)[number]['id']

export function BusinessNumbers() {
  const [params, setParams] = useSearchParams()
  const [overview, setOverview] = useState<BnOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useCallback(
    () =>
      businessNumbersApi.overview().then(
        (o) => {
          setOverview(o)
          setError(null)
        },
        (err) => setError(getApiErrorMessage(err)),
      ),
    [],
  )

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const tabs = TABS.filter((t) => !t.managerOnly || overview?.canManage)
  const requested = params.get('tab')
  const tab: TabId = tabs.some((t) => t.id === requested) ? (requested as TabId) : 'mine'
  const selectTab = (id: TabId) => {
    const next = new URLSearchParams(params)
    next.set('tab', id)
    setParams(next, { replace: true })
  }

  const usage =
    overview && overview.limit !== null ? (
      <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#8B7355] ring-1 ring-[#8B7355]/15">
        {overview.used} of {overview.limit} numbers used
      </span>
    ) : null

  return (
    <div>
      <PageHeader title="Business Numbers" subtitle="Dedicated phone numbers for calling and messaging your leads" actions={usage} />

      {error ? <div className="mb-4 rounded-lg border border-[#D96B6B]/40 bg-[#D96B6B]/10 px-4 py-3 text-sm text-[#9c3d3d]">{error}</div> : null}
      {overview && !overview.available ? (
        <div className="mb-4 rounded-lg border border-[#F2C94C]/60 bg-[#F2C94C]/15 px-4 py-3 text-sm text-[#6b5500]">
          {overview.canManage
            ? 'Number purchasing is switched off: the platform telephony credentials are not set on the server (see .env.example → Business Numbers).'
            : 'Getting new numbers is temporarily unavailable. Your existing numbers are not affected.'}
        </div>
      ) : null}

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#8B7355]/10 bg-white p-1" role="tablist">
        {tabs.map((t) => {
          const active = t.id === tab
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(t.id)}
              className={[
                'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                active ? 'bg-[#8B7355] text-white' : 'text-[#8B7355] hover:bg-[#F5EFE7]',
              ].join(' ')}
            >
              <Icon size={15} aria-hidden />
              {t.label}
            </button>
          )
        })}
      </div>

      {!overview ? (
        <p className="text-sm text-[#8B7355]">Loading…</p>
      ) : (
        <>
          {tab === 'mine' ? <MyNumbersTab onBuy={() => selectTab('get')} onChanged={() => void loadOverview()} /> : null}
          {tab === 'get' ? (
            <GetNumberTab
              overview={overview}
              onPurchased={() => {
                void loadOverview()
                selectTab('mine')
              }}
            />
          ) : null}
          {tab === 'all' ? <AllNumbersTab onChanged={() => void loadOverview()} /> : null}
          {tab === 'unassigned' ? <UnassignedTab overview={overview} onChanged={() => void loadOverview()} /> : null}
        </>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { FiPhone, FiSearch, FiUserPlus } from 'react-icons/fi'

import type { CrmUserDTO } from '../../lib/usersApi'
import { toIndiaTelHref } from '../../utils/phone'
import { ProfileAvatar } from './ProfileAvatar'
import { btnPrimary, formatDate } from './shared'

export function TeamDirectory({
  items,
  loading,
  error,
  currentUserId,
  onNewUser,
}: {
  items: CrmUserDTO[]
  loading: boolean
  error: string | null
  currentUserId?: string
  onNewUser?: () => void
}) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')

  const roles = useMemo(() => {
    const counts = new Map<string, number>()
    for (const u of items) {
      const r = u.role || 'No role'
      counts.set(r, (counts.get(r) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((u) => {
      if (role !== 'all' && (u.role || 'No role') !== role) return false
      if (!q) return true
      return [u.name, u.email, u.phone, u.designation, u.location].some((v) => v?.toLowerCase().includes(q))
    })
  }, [items, query, role])

  const chip = (active: boolean) =>
    `inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition ${
      active ? 'bg-[#2E2E2E] text-white' : 'bg-white text-[#2E2E2E] ring-1 ring-[#E8DCCB] hover:bg-[#F5EFE7]'
    }`

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-3 min-[640px]:flex-row min-[640px]:items-end min-[640px]:justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#2E2E2E]">Team directory</h2>
          <p className="mt-0.5 text-[12px] font-medium text-[#8B7355]">
            {items.length} {items.length === 1 ? 'person' : 'people'} registered in this CRM
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 min-[640px]:w-72 min-[640px]:flex-none">
            <FiSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone…"
              className="h-10 w-full rounded-xl border border-[#E8DCCB] bg-white pl-9 pr-3 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none"
              aria-label="Search team"
            />
          </div>
          {onNewUser ? (
            <button type="button" onClick={onNewUser} className={`${btnPrimary} h-10 rounded-xl`}>
              <FiUserPlus size={14} aria-hidden /> <span className="hidden min-[420px]:inline">New user</span>
            </button>
          ) : null}
        </div>
      </div>

      {roles.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={chip(role === 'all')} onClick={() => setRole('all')}>
            All <span className="opacity-60">{items.length}</span>
          </button>
          {roles.map(([r, n]) => (
            <button key={r} type="button" className={chip(role === r)} onClick={() => setRole(r)}>
              <span className="capitalize">{r}</span> <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#E8DCCB] bg-white">
        {loading ? (
          <div className="divide-y divide-[#F5EFE7]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 rounded-full bg-[#F5EFE7]" />
                <div className="h-3 w-40 rounded bg-[#F5EFE7]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-[13px] font-medium text-[#D96B6B]">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] font-medium text-[#8B7355]">
            {items.length === 0 ? 'No users found' : 'No one matches your search'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E8DCCB] bg-[#FBF8F4] text-[11px] uppercase tracking-wide text-[#8B7355]">
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isMe = row.id === currentUserId
                  const tel = row.phone ? toIndiaTelHref(row.phone) ?? `tel:${row.phone.replace(/[^\d+]/g, '')}` : null
                  return (
                    <tr key={row.id} className={`border-b border-[#F5EFE7] last:border-0 ${isMe ? 'bg-[#F5EFE7]/50' : 'hover:bg-[#FBF8F4]'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative">
                            <ProfileAvatar name={row.name} url={row.avatar_url} size={36} />
                            {row.is_active === false ? (
                              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#C9C1B6]" title="Inactive" />
                            ) : null}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#2E2E2E]">
                              {row.name}
                              {isMe ? <span className="ml-1.5 text-[11px] font-semibold text-[#8B7355]">(you)</span> : null}
                            </div>
                            <div className="truncate text-[12px] text-[#8B7355]">{row.designation || row.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.role ? (
                          <span className="rounded-full bg-[#F5EFE7] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-[#8B7355]">{row.role}</span>
                        ) : (
                          <span className="text-[#8B7355]/70">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${row.email}`} className="block text-[12px] text-[#2E2E2E] hover:text-[#8B7355]">
                          {row.email}
                        </a>
                        {row.phone && tel ? (
                          <a href={tel} className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[#8B7355] hover:text-[#2E2E2E]">
                            <FiPhone size={11} aria-hidden /> {row.phone}
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[#8B7355]">{row.location || '—'}</td>
                      <td className="px-4 py-3 text-[#8B7355]">{formatDate(row.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

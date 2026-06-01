import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { confirmLeaveFromBulkUploadIfNeeded } from '../lib/bulkUploadNavigation'
import { fetchUsers, type CrmUserDTO } from '../lib/usersApi'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { authActions } from '../store/authSlice'

function formatJoined(iso?: string) {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const [items, setItems] = useState<CrmUserDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setListError(null)
    fetchUsers()
      .then((res) => {
        if (!cancelled) setItems(res.items ?? [])
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setListError(err.message ?? 'Could not load users')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onLogout = () => {
    if (!confirmLeaveFromBulkUploadIfNeeded(location.pathname)) return
    dispatch(authActions.logout())
    navigate('/login')
  }

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#2E2E2E]">Profile</h1>
        <p className="mt-1 text-[13px] font-medium text-[#8B7355]">Your account and team directory</p>
      </div>

      <div className="rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6  min-[520px]:p-8">
        <div className="flex flex-col gap-6 min-[640px]:flex-row min-[640px]:items-start min-[640px]:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[#8B7355]">Signed in as</div>
            <div className="mt-2 text-[20px] font-bold text-[#2E2E2E]">{user?.name ?? '—'}</div>
            <div className="mt-1 text-[13px] font-medium text-[#8B7355]">{user?.email ?? '—'}</div>
            {user?.role != null && (typeof user.role === 'string' ? user.role !== '' : true) ? (
              <div className="mt-3 inline-flex rounded-full bg-[#F5EFE7] px-3 py-1 text-[12px] font-semibold text-[#8B7355]">
                Role: {typeof user.role === 'string' ? user.role : user.role.name}
              </div>
            ) : (
              <div className="mt-3 text-[12px] font-medium text-[#8B7355]">No role assigned</div>
            )}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-[#E8DCCB] bg-white px-6 text-[13px] font-semibold text-[#2E2E2E] shadow-sm hover:bg-[#F5EFE7]"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-[16px] font-bold text-[#2E2E2E]">All users</h2>
        <p className="mt-1 text-[12px] font-medium text-[#8B7355]">Everyone registered in this CRM</p>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#E8DCCB] bg-white">
          {loading ? (
            <div className="px-4 py-10 text-center text-[13px] font-medium text-[#8B7355]">Loading…</div>
          ) : listError ? (
            <div className="px-4 py-10 text-center text-[13px] font-medium text-[#D96B6B]">{listError}</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] font-medium text-[#8B7355]">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E8DCCB] bg-gray-50/80">
                    <th className="px-4 py-3 font-semibold text-[#2E2E2E]">Name</th>
                    <th className="px-4 py-3 font-semibold text-[#2E2E2E]">Email</th>
                    <th className="px-4 py-3 font-semibold text-[#2E2E2E]">Role</th>
                    <th className="px-4 py-3 font-semibold text-[#2E2E2E]">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-[#E8DCCB] last:border-0${row.id === user?.id ? ' bg-[#F5EFE7]/60' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-[#2E2E2E]">
                        {row.name}
                        {row.id === user?.id ? (
                          <span className="ml-2 text-[11px] font-semibold text-[#8B7355]">(you)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[#8B7355]">{row.email}</td>
                      <td className="px-4 py-3 text-[#8B7355]">{row.role ?? '—'}</td>
                      <td className="px-4 py-3 text-[#8B7355]">{formatJoined(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

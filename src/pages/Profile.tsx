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
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-gray-900">Profile</h1>
        <p className="mt-1 text-[13px] font-medium text-gray-500">Your account and team directory</p>
      </div>

      <div className="rounded-3xl border border-gray-900/5 bg-[#FDFBF7] p-6 shadow-[0_20px_60px_rgba(17,24,39,0.08)] min-[520px]:p-8">
        <div className="flex flex-col gap-6 min-[640px]:flex-row min-[640px]:items-start min-[640px]:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Signed in as</div>
            <div className="mt-2 text-[20px] font-bold text-gray-900">{user?.name ?? '—'}</div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">{user?.email ?? '—'}</div>
            {user?.role != null && user.role !== '' ? (
              <div className="mt-3 inline-flex rounded-full bg-[#faf6ef] px-3 py-1 text-[12px] font-semibold text-[#80654a]">
                Role: {user.role}
              </div>
            ) : (
              <div className="mt-3 text-[12px] font-medium text-gray-400">No role assigned</div>
            )}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl border border-gray-300 bg-white px-6 text-[13px] font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-[16px] font-bold text-gray-900">All users</h2>
        <p className="mt-1 text-[12px] font-medium text-gray-500">Everyone registered in this CRM</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {loading ? (
            <div className="px-4 py-10 text-center text-[13px] font-medium text-gray-500">Loading…</div>
          ) : listError ? (
            <div className="px-4 py-10 text-center text-[13px] font-medium text-rose-600">{listError}</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] font-medium text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 last:border-0${row.id === user?.id ? ' bg-[#faf6ef]/60' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.name}
                        {row.id === user?.id ? (
                          <span className="ml-2 text-[11px] font-semibold text-[#80654a]">(you)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.email}</td>
                      <td className="px-4 py-3 text-gray-600">{row.role ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{formatJoined(row.created_at)}</td>
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

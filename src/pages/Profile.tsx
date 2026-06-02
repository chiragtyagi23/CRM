import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiMail, FiUser, FiUsers } from 'react-icons/fi'

import { Modal } from '../components/acl/Modal'
import { SearchableSelect } from '../components/uiPrimitives'
import { confirmLeaveFromBulkUploadIfNeeded } from '../lib/bulkUploadNavigation'
import { createUser, fetchRoles, fetchUsers, type CrmUserDTO } from '../lib/usersApi'
import type { AclRoleDTO } from '../acl/types'
import type { ApiError } from '../lib/crmApi'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { authActions } from '../store/authSlice'
import { useACL } from '../acl/useACL'

function formatJoined(iso?: string) {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function extractError(err: unknown): string {
  const apiErr = err as ApiError | undefined
  const body = apiErr?.body as { error?: unknown } | undefined
  if (body && typeof body.error === 'string' && body.error.trim()) return body.error
  return apiErr?.message ?? 'Something went wrong'
}

export function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { permissions } = useACL()
  const canCreateNewUser = permissions.profile.newUser
  const canViewAllUsers = permissions.profile.allUserTable
  const [items, setItems] = useState<CrmUserDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [newUserOpen, setNewUserOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRoleId, setNewRoleId] = useState('')
  const [roles, setRoles] = useState<AclRoleDTO[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadUsers = () => {
    if (!canViewAllUsers) {
      setItems([])
      setLoading(false)
      setListError(null)
      return Promise.resolve()
    }
    setLoading(true)
    setListError(null)
    return fetchUsers()
      .then((res) => setItems(res.items ?? []))
      .catch((err: { message?: string }) => setListError(err.message ?? 'Could not load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    const tasks: Promise<void>[] = []
    if (canViewAllUsers) {
      setLoading(true)
      setListError(null)
      tasks.push(
        fetchUsers()
          .then((usersRes) => {
            if (!cancelled) setItems(usersRes.items ?? [])
          })
          .catch((err: { message?: string }) => {
            if (!cancelled) setListError(err.message ?? 'Could not load users')
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          }),
      )
    } else {
      setLoading(false)
      setItems([])
      setListError(null)
    }

    if (canCreateNewUser) {
      setRolesLoading(true)
      setRolesError(null)
      tasks.push(
        fetchRoles()
          .then((rolesRes) => {
            if (!cancelled) {
              setRoles(rolesRes.items ?? [])
              setRolesError(null)
            }
          })
          .catch((err: unknown) => {
            if (!cancelled) {
              setRoles([])
              setRolesError(extractError(err))
            }
          })
          .finally(() => {
            if (!cancelled) setRolesLoading(false)
          }),
      )
    } else {
      setRoles([])
      setRolesError(null)
      setRolesLoading(false)
    }

    void Promise.allSettled(tasks)
    return () => {
      cancelled = true
    }
  }, [canCreateNewUser, canViewAllUsers])

  const nameError = useMemo(() => {
    if (!newName.trim()) return 'Name is required'
    return ''
  }, [newName])

  const emailError = useMemo(() => {
    const value = newEmail.trim()
    if (!value) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
    return ''
  }, [newEmail])

  const canSaveNewUser = !nameError && !emailError && !saving

  const roleOptions = useMemo(
    () => [
      { value: '', label: 'Worker (default)' },
      ...roles.map((r) => ({ id: r.id, value: r.id, label: r.name })),
    ],
    [roles],
  )

  const loadRolesList = (cancelled = false) => {
    setRolesLoading(true)
    setRolesError(null)
    return fetchRoles()
      .then((rolesRes) => {
        if (!cancelled) {
          setRoles(rolesRes.items ?? [])
          setRolesError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRoles([])
          setRolesError(extractError(err))
        }
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false)
      })
  }

  const openNewUserModal = () => {
    setNewName('')
    setNewEmail('')
    setNewRoleId('')
    setFormError(null)
    setNewUserOpen(true)
    if (canCreateNewUser) void loadRolesList()
  }

  const closeNewUserModal = () => {
    if (saving) return
    setNewUserOpen(false)
    setFormError(null)
  }

  const onSaveNewUser = async () => {
    if (!canSaveNewUser) return
    setSaving(true)
    setFormError(null)
    try {
      const res = await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        roleId: newRoleId || undefined,
      })
      setNewUserOpen(false)
      setSuccessMessage(res.message || `Invitation sent to ${newEmail.trim()}`)
      await loadUsers()
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  const onLogout = () => {
    if (!confirmLeaveFromBulkUploadIfNeeded(location.pathname)) return
    dispatch(authActions.logout())
    navigate('/login')
  }

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2E2E2E]">Profile</h1>
          <p className="mt-1 text-[13px] font-medium text-[#8B7355]">Your account and team directory</p>
        </div>
        {canCreateNewUser ? (
          <button
            type="button"
            onClick={openNewUserModal}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#8B7355] px-6 text-[13px] font-semibold text-white shadow-sm hover:bg-[#6d5a43]"
          >
            New user
          </button>
        ) : null}
      </div>

      {successMessage ? (
        <div className="mb-6 rounded-xl border border-[#8B7355]/20 bg-[#F5EFE7] px-4 py-3 text-[13px] font-medium text-[#2E2E2E]">
          {successMessage}
          <button
            type="button"
            className="ml-3 text-[12px] font-semibold text-[#8B7355] underline"
            onClick={() => setSuccessMessage(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

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

      {canViewAllUsers ? (
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
      ) : null}

      <Modal
        open={canCreateNewUser && newUserOpen}
        title="New user"
        onClose={closeNewUserModal}
        allowDropdownOverflow
        footer={
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={closeNewUserModal} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="acl-btn acl-btn--primary"
              onClick={() => void onSaveNewUser()}
              disabled={!canSaveNewUser}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <div className="mb-5 rounded-xl border border-[#E8DCCB] bg-[#F5EFE7]/60 px-4 py-3 text-[12px] text-[#8B7355]">
          A random password is generated and emailed with the CRM login link.
        </div>
        <div className="flex flex-col gap-5">
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold text-[#8B7355]">Full name</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]">
                <FiUser size={16} aria-hidden />
              </span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white pl-10 pr-4 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355] focus:border-[#8B7355] focus:outline-none"
              />
            </div>
            {nameError && newName.length > 0 ? (
              <div className="mt-1 text-[12px] font-medium text-[#D96B6B]">{nameError}</div>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold text-[#8B7355]">Email</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]">
                <FiMail size={16} aria-hidden />
              </span>
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jane@company.com"
                type="email"
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white pl-10 pr-4 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355] focus:border-[#8B7355] focus:outline-none"
              />
            </div>
            {emailError && newEmail.length > 0 ? (
              <div className="mt-1 text-[12px] font-medium text-[#D96B6B]">{emailError}</div>
            ) : null}
          </label>
          <div className="block">
            <span className="mb-2 block text-[12px] font-semibold text-[#8B7355]">Role</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#8B7355]">
                <FiUsers size={16} aria-hidden />
              </span>
              <SearchableSelect
                value={newRoleId}
                onChange={setNewRoleId}
                options={roleOptions}
                placeholder={rolesLoading ? 'Loading roles…' : 'Worker (default)'}
                searchPlaceholder="Search roles…"
                emptyMessage={rolesError ?? 'No roles found'}
                disabled={rolesLoading}
              />
            </div>
            {rolesError ? (
              <div className="mt-1 text-[12px] font-medium text-[#D96B6B]">{rolesError}</div>
            ) : null}
            {!rolesLoading && !rolesError && roles.length === 0 ? (
              <div className="mt-1 text-[12px] text-[#8B7355]">No roles in database yet. Worker will be used by default.</div>
            ) : null}
          </div>
          {formError ? <div className="text-[13px] font-medium text-[#D96B6B]">{formError}</div> : null}
        </div>
      </Modal>
    </div>
  )
}

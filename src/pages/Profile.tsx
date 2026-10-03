import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiAlertCircle, FiCheckCircle, FiMail, FiUser, FiUsers, FiX } from 'react-icons/fi'

import { Modal } from '../components/acl/Modal'
import { SearchableSelect } from '../components/uiPrimitives'
import { AccessCard } from '../components/profile/AccessCard'
import { BusinessCardModal } from '../components/profile/BusinessCardModal'
import { ContactDetailsCard } from '../components/profile/ContactDetailsCard'
import { PerformanceCard } from '../components/profile/PerformanceCard'
import { ProfileHero, type CompletenessItem } from '../components/profile/ProfileHero'
import { SecurityCard } from '../components/profile/SecurityCard'
import { SummaryCard } from '../components/profile/SummaryCard'
import { TeamDirectory } from '../components/profile/TeamDirectory'
import { extractError, roleName } from '../components/profile/shared'
import { confirmLeaveFromBulkUploadIfNeeded } from '../lib/bulkUploadNavigation'
import {
  deleteMyAvatar,
  fetchMyProfile,
  fetchMyStats,
  updateMyProfile,
  uploadMyAvatar,
  type MyProfileDTO,
  type MyProfilePatch,
  type MyStatsDTO,
} from '../lib/profileApi'
import { createUser, fetchRoles, fetchUsers, type CrmUserDTO } from '../lib/usersApi'
import type { AclRoleDTO } from '../acl/types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { authActions } from '../store/authSlice'
import { useACL } from '../acl/useACL'

type Toast = { kind: 'success' | 'error'; message: string }

function HeroSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-[#8B7355]/10 bg-white">
      <div className="h-36 bg-[#E8DCCB] min-[640px]:h-44" />
      <div className="px-8 pb-8">
        <div className="-mt-14 h-[120px] w-[120px] rounded-full bg-[#F5EFE7] ring-4 ring-white" />
        <div className="mt-4 h-6 w-56 rounded bg-[#F5EFE7]" />
        <div className="mt-2 h-4 w-40 rounded bg-[#F5EFE7]" />
      </div>
    </div>
  )
}

export function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { permissions } = useACL()
  const canCreateNewUser = permissions.profile.newUser
  const canViewAllUsers = permissions.profile.allUserTable

  const [toast, setToast] = useState<Toast | null>(null)

  const [profile, setProfile] = useState<MyProfileDTO | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)

  const [stats, setStats] = useState<MyStatsDTO | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(t)
  }, [toast])

  const loadProfile = useCallback(() => {
    setProfileLoading(true)
    setProfileError(null)
    return fetchMyProfile()
      .then(setProfile)
      .catch((err: unknown) => setProfileError(extractError(err)))
      .finally(() => setProfileLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchMyProfile()
      .then((res) => {
        if (!cancelled) setProfile(res)
      })
      .catch((err: unknown) => {
        if (!cancelled) setProfileError(extractError(err))
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    fetchMyStats()
      .then((res) => {
        if (!cancelled) setStats(res)
      })
      .catch((err: unknown) => {
        if (!cancelled) setStatsError(extractError(err))
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** Keep the header (Redux user) in sync with the latest profile photo. */
  const applyProfile = (next: MyProfileDTO) => {
    setProfile(next)
    dispatch(authActions.updateUser({ avatarUrl: next.avatarUrl }))
  }

  const onSaveDetails = async (patch: MyProfilePatch) => {
    const next = await updateMyProfile(patch)
    applyProfile(next)
    const [key, value] = Object.entries(patch)[0] ?? []
    const label = key === 'phone' ? 'Contact number' : key === 'linkedinUrl' ? 'LinkedIn' : key ? key[0].toUpperCase() + key.slice(1) : 'Profile'
    setToast({ kind: 'success', message: value ? `${label} saved` : `${label} removed` })
  }

  const onPhotoSelected = async (file: File) => {
    setPhotoBusy(true)
    try {
      applyProfile(await uploadMyAvatar(file))
      setToast({ kind: 'success', message: 'Profile photo updated' })
    } catch (err) {
      setToast({ kind: 'error', message: extractError(err) })
    } finally {
      setPhotoBusy(false)
    }
  }

  const onPhotoRemove = async () => {
    if (!profile || !window.confirm('Remove your profile photo?')) return
    setPhotoBusy(true)
    try {
      await deleteMyAvatar()
      applyProfile({ ...profile, avatarUrl: null })
      setToast({ kind: 'success', message: 'Profile photo removed' })
    } catch (err) {
      setToast({ kind: 'error', message: extractError(err) })
    } finally {
      setPhotoBusy(false)
    }
  }

  const roleLabel = profile?.role?.name ?? roleName(user?.role)

  const completeness: CompletenessItem[] = useMemo(
    () =>
      profile
        ? [
            { key: 'photo', label: 'Photo', done: !!profile.avatarUrl, targetId: 'profile-contact' },
            { key: 'phone', label: 'Contact number', done: !!profile.phone, targetId: 'profile-contact' },
            { key: 'designation', label: 'Designation', done: !!profile.designation, targetId: 'profile-contact' },
            { key: 'summary', label: 'About me', done: !!profile.summary, targetId: 'profile-summary' },
            { key: 'location', label: 'Location', done: !!profile.location, targetId: 'profile-contact' },
            { key: 'linkedin', label: 'LinkedIn', done: !!profile.linkedinUrl, targetId: 'profile-contact' },
          ]
        : [],
    [profile],
  )

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

  // Directory rows carry the photo too — reflect your latest photo/details without refetching.
  const directoryItems = useMemo(
    () =>
      profile
        ? items.map((r) =>
            r.id === profile.id
              ? { ...r, avatar_url: profile.avatarUrl, phone: profile.phone, designation: profile.designation, location: profile.location }
              : r,
          )
        : items,
    [items, profile],
  )

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
      setToast({ kind: 'success', message: res.message || `Invitation sent to ${newEmail.trim()}` })
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
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 min-[640px]:py-10">
      {toast ? (
        <div className="fixed right-4 top-20 z-[90] max-w-[calc(100vw-2rem)]" role="status" aria-live="polite">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px] font-medium shadow-lg ${
              toast.kind === 'success' ? 'border-[#CFE0CE] bg-[#F3F8F3] text-[#3F6B3E]' : 'border-[#F0CFCF] bg-[#FDF3F3] text-[#B54D4D]'
            }`}
          >
            {toast.kind === 'success' ? <FiCheckCircle size={16} aria-hidden /> : <FiAlertCircle size={16} aria-hidden />}
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100" aria-label="Dismiss">
              <FiX size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {profileLoading && !profile ? (
        <HeroSkeleton />
      ) : profileError && !profile ? (
        <div className="rounded-2xl border border-[#F0CFCF] bg-[#FDF3F3] px-6 py-8 text-center">
          <div className="text-[14px] font-semibold text-[#B54D4D]">Could not load your profile</div>
          <div className="mt-1 text-[13px] text-[#B54D4D]/80">{profileError}</div>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="inline-flex h-9 items-center rounded-lg bg-[#8B7355] px-4 text-[12px] font-semibold text-white hover:bg-[#6d5a43]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 items-center rounded-lg border border-[#E8DCCB] bg-white px-4 text-[12px] font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7]"
            >
              Log out
            </button>
          </div>
        </div>
      ) : profile ? (
        <>
          <ProfileHero
            profile={profile}
            roleLabel={roleLabel}
            completeness={completeness}
            photoBusy={photoBusy}
            onPhotoSelected={(f) => void onPhotoSelected(f)}
            onPhotoRemove={() => void onPhotoRemove()}
            onPhotoError={(message) => setToast({ kind: 'error', message })}
            onShareCard={() => setCardOpen(true)}
            onLogout={onLogout}
          />

          <div className="mt-6 grid gap-6 min-[1024px]:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <ContactDetailsCard profile={profile} onSave={onSaveDetails} />
              <AccessCard roleLabel={roleLabel} />
            </div>
            <div className="flex min-w-0 flex-col gap-6">
              <SummaryCard summary={profile.summary} onChange={(summary) => setProfile((p) => (p ? { ...p, summary } : p))} />
              <PerformanceCard stats={stats} loading={statsLoading} error={statsError} />
              <SecurityCard />
            </div>
          </div>

          <BusinessCardModal open={cardOpen} onClose={() => setCardOpen(false)} profile={profile} roleLabel={roleLabel} />
        </>
      ) : null}

      {canViewAllUsers ? (
        <TeamDirectory
          items={directoryItems}
          loading={loading}
          error={listError}
          currentUserId={user?.id}
          onNewUser={canCreateNewUser ? openNewUserModal : undefined}
        />
      ) : canCreateNewUser ? (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={openNewUserModal}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#8B7355] px-6 text-[13px] font-semibold text-white shadow-sm hover:bg-[#6d5a43]"
          >
            New user
          </button>
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

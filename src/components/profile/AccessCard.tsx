import { useMemo } from 'react'
import { FiShield } from 'react-icons/fi'

import { useAppSelector } from '../../store/hooks'
import { card, cardSubtitle, cardTitle } from './shared'

/** Read-only view of the modules the signed-in user's role grants (plus overrides). */
export function AccessCard({ roleLabel }: { roleLabel: string | null }) {
  const access = useAppSelector((s) => s.auth.access)

  const groups = useMemo(() => {
    const modules = access?.modules ?? []
    const parents = modules.filter((m) => !m.parent_id)
    return parents.map((p) => ({
      id: p.id,
      name: p.name,
      children: modules.filter((m) => m.parent_id === p.id).map((c) => c.name),
    }))
  }, [access])

  return (
    <section className={card}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE7] text-[#8B7355]">
          <FiShield size={16} aria-hidden />
        </span>
        <div>
          <h2 className={cardTitle}>My access</h2>
          <p className={cardSubtitle}>{roleLabel ? `What the ${roleLabel} role lets you use` : 'No role assigned yet'}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="mt-4 text-[12px] text-[#8B7355]">No modules assigned. Ask an admin to grant access.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {groups.map((g) => (
            <li key={g.id}>
              <div className="text-[13px] font-semibold text-[#2E2E2E]">{g.name}</div>
              {g.children.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {g.children.map((c) => (
                    <span key={c} className="rounded-md bg-[#F5EFE7] px-2 py-0.5 text-[11px] font-medium text-[#8B7355]">
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

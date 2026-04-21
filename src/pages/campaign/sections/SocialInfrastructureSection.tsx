import type { Dispatch, SetStateAction } from 'react'

import type { SocialInfraGroup } from '../types'
import { Field } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { inputClassName } from '../ui/classNames'

export function SocialInfrastructureSection({
  socialInfrastructureGroups,
  setSocialInfrastructureGroups,
}: {
  socialInfrastructureGroups: SocialInfraGroup[]
  setSocialInfrastructureGroups: Dispatch<SetStateAction<SocialInfraGroup[]>>
}) {
  return (
    <SectionCard
      title="Social infrastructure"
      subtitle="Create cards like Transportation, Education, Healthcare. Each card has sub-items (name + value) with add/remove."
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">{socialInfrastructureGroups.length} cards</div>
        <button
          type="button"
          className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50"
          onClick={() =>
            setSocialInfrastructureGroups((prev) => [...prev, { title: '', items: [{ name: '', value: '' }] }])
          }
        >
          Add card
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {socialInfrastructureGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Field label="Main heading" required>
                  <input
                    className={inputClassName()}
                    placeholder="e.g. Transportation"
                    value={group.title}
                    onChange={(e) =>
                      setSocialInfrastructureGroups((prev) =>
                        prev.map((g, i) => (i === groupIdx ? { ...g, title: e.target.value } : g)),
                      )
                    }
                  />
                </Field>
              </div>
              <button
                type="button"
                className={
                  socialInfrastructureGroups.length <= 1
                    ? 'h-9 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed'
                    : 'h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                }
                disabled={socialInfrastructureGroups.length <= 1}
                onClick={() => setSocialInfrastructureGroups((prev) => prev.filter((_, i) => i !== groupIdx))}
              >
                Remove card
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">{group.items.length} items</div>
              <button
                type="button"
                className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
                onClick={() =>
                  setSocialInfrastructureGroups((prev) =>
                    prev.map((g, i) => (i === groupIdx ? { ...g, items: [...g.items, { name: '', value: '' }] } : g)),
                  )
                }
              >
                Add item
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {group.items.map((item, itemIdx) => (
                <div key={itemIdx} className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-2 items-center">
                  <input
                    className={inputClassName()}
                    placeholder="Subheading (e.g. Metro Station)"
                    value={item.name}
                    onChange={(e) =>
                      setSocialInfrastructureGroups((prev) =>
                        prev.map((g, i) =>
                          i === groupIdx
                            ? {
                                ...g,
                                items: g.items.map((it, j) => (j === itemIdx ? { ...it, name: e.target.value } : it)),
                              }
                            : g,
                        ),
                      )
                    }
                  />
                  <input
                    className={inputClassName()}
                    placeholder="Value (e.g. 12 mins / 2.1 km)"
                    value={item.value}
                    onChange={(e) =>
                      setSocialInfrastructureGroups((prev) =>
                        prev.map((g, i) =>
                          i === groupIdx
                            ? {
                                ...g,
                                items: g.items.map((it, j) => (j === itemIdx ? { ...it, value: e.target.value } : it)),
                              }
                            : g,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={
                      group.items.length <= 1
                        ? 'h-10 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed'
                        : 'h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                    }
                    disabled={group.items.length <= 1}
                    onClick={() =>
                      setSocialInfrastructureGroups((prev) =>
                        prev.map((g, i) =>
                          i === groupIdx ? { ...g, items: g.items.filter((_, j) => j !== itemIdx) } : g,
                        ),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

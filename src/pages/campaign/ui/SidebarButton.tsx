export function SidebarButton({ active, label, helper, onClick }: { active: boolean; label: string; helper: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'w-full text-left rounded-xl px-3 py-3 bg-violet-600 text-white shadow-sm'
          : 'w-full text-left rounded-xl px-3 py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-900'
      }
    >
      <div className="font-semibold">{label}</div>
      <div className={active ? 'mt-1 text-xs text-white/80' : 'mt-1 text-xs text-gray-500'}>{helper}</div>
    </button>
  )
}

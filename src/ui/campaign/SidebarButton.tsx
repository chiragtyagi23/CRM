export function SidebarButton({ active, label, helper, onClick }: { active: boolean; label: string; helper: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'w-full text-left rounded-xl px-3 py-3 bg-violet-600 text-white shadow-sm'
          : 'w-full text-left rounded-xl px-3 py-3 bg-white border border-[#E8DCCB] hover:border-[#E8DCCB] text-[#2E2E2E]'
      }
    >
      <div className="font-semibold">{label}</div>
      <div className={active ? 'mt-1 text-xs text-white/80' : 'mt-1 text-xs text-[#8B7355]'}>{helper}</div>
    </button>
  )
}
export function inputClassName() {
  return [
    'w-full h-10 px-3 rounded-lg border text-sm',
    'bg-white border-[#E8DCCB] text-[#2E2E2E]',
    'placeholder:text-[#8B7355]/60',
    'focus:outline-none focus:border-[#8B7355]',
  ].join(' ')
}

export function textareaClassName(heightClass: string) {
  return [
    'w-full px-3 py-2 rounded-lg border text-sm',
    'bg-white border-[#E8DCCB] text-[#2E2E2E]',
    'placeholder:text-[#8B7355]/60',
    'focus:outline-none focus:border-[#8B7355]',
    heightClass,
  ].join(' ')
}

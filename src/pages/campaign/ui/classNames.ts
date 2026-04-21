export function inputClassName() {
  return [
    'w-full h-10 px-3 rounded-lg border',
    'bg-white border-gray-200 text-gray-900',
    'placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-300/60',
  ].join(' ')
}

export function textareaClassName(heightClass: string) {
  return [
    'w-full px-3 py-2 rounded-lg border',
    'bg-white border-gray-200 text-gray-900',
    'placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-300/60',
    heightClass,
  ].join(' ')
}

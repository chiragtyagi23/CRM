import { useState } from 'react'

import { resolveUploadPublicUrl } from '../../lib/crmApi'

const GRADIENTS = [
  'from-[#8B7355] to-[#5C4A35]',
  'from-[#A0826D] to-[#6B5444]',
  'from-[#7C8B6F] to-[#4F5C45]',
  'from-[#6F7F8B] to-[#45525C]',
  'from-[#8B6F7C] to-[#5C4552]',
  'from-[#B08D57] to-[#7A6038]',
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase()
}

function gradientFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

/** Profile photo with an initials fallback (also used when the image fails to load). */
export function ProfileAvatar({
  name,
  url,
  size = 40,
  className = '',
}: {
  name: string
  url?: string | null
  size?: number
  className?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const src = url ? resolveUploadPublicUrl(url) : null
  const showImage = src && failedUrl !== src

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${gradientFor(name || '?')} font-bold text-white select-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      aria-hidden={!showImage}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(src)}
          draggable={false}
        />
      ) : (
        initials(name || '?')
      )}
    </span>
  )
}

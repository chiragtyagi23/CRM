import { useId, useState, type ChangeEvent } from 'react'

import { apiUploadImage } from '../../../lib/crmApi'
import { inputClassName } from './classNames'

export function UploadTile({
  label,
  hint,
  aspect,
  value,
  onChange,
  onRemove,
}: {
  label: string
  hint: string
  aspect?: 'banner' | 'square' | 'wide' | 'tall'
  value?: { src: string; alt: string }
  onChange?: (next: { src: string; alt: string }) => void
  onRemove?: () => void
}) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const aspectClass =
    aspect === 'banner'
      ? 'aspect-[16/7]'
      : aspect === 'wide'
        ? 'aspect-[16/10]'
        : aspect === 'tall'
          ? 'aspect-[3/4]'
          : 'aspect-square'

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onChange) return
    setUploadError(null)
    setUploading(true)
    try {
      const absoluteUrl = await apiUploadImage(file)
      onChange({
        src: absoluteUrl,
        alt: value?.alt?.trim() ? value.alt : file.name.replace(/\.[^/.]+$/, '') || label,
      })
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Upload failed'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          <div className="mt-1 text-xs text-gray-600">{hint}</div>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="h-8 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className={`mt-3 rounded-xl border border-gray-200 bg-white ${aspectClass} grid place-items-center overflow-hidden`}>
        {value?.src ? <img src={value.src} alt={value.alt || label} className="w-full h-full object-cover" /> : <div className="text-gray-400 text-xs">Preview</div>}
      </div>
      {onChange ? (
        <div className="mt-3 grid grid-cols-1 gap-2">
          <input
            className={inputClassName()}
            placeholder="Image URL (paste or use Upload below)"
            value={value?.src ?? ''}
            onChange={(e) => onChange({ src: e.target.value, alt: value?.alt ?? '' })}
          />
          <input
            className={inputClassName()}
            placeholder="Alt text"
            value={value?.alt ?? ''}
            onChange={(e) => onChange({ src: value?.src ?? '', alt: e.target.value })}
          />
        </div>
      ) : null}
      {onChange ? (
        <div className="mt-3">
          <input id={inputId} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFileChange} />
          <label
            htmlFor={inputId}
            className={
              uploading
                ? 'inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm font-semibold cursor-wait'
                : 'inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer'
            }
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </label>
          {uploadError ? <div className="mt-2 text-xs text-rose-600">{uploadError}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

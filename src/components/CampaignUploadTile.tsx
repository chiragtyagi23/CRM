import { useId, useState, type ChangeEvent } from 'react'

import { apiUploadImage } from '../lib/crmApi'
import { inputClassName } from '../ui/campaign/classNames'
import * as UTIF from 'utif'

function isLikelyTiff(file: File) {
  const name = file.name.toLowerCase()
  return file.type === 'image/tiff' || name.endsWith('.tif') || name.endsWith('.tiff')
}

async function previewUrlForFile(file: File): Promise<string> {
  if (!isLikelyTiff(file)) return URL.createObjectURL(file)
  const buf = await file.arrayBuffer()
  const ifds = UTIF.decode(buf)
  const first = ifds[0]
  if (!first) return ''
  UTIF.decodeImage(buf, first)
  const rgba = UTIF.toRGBA8(first)
  const w = Number(first.width ?? 0)
  const h = Number(first.height ?? 0)
  if (!w || !h) return ''
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const imgData = new ImageData(new Uint8ClampedArray(rgba), w, h)
  ctx.putImageData(imgData, 0, 0)
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return ''
  return URL.createObjectURL(blob)
}

export async function buildImageValueFromFile(
  file: File,
  labelFallback: string,
  currentAlt?: string,
): Promise<{ src: string; alt: string; file: File }> {
  const previewUrl = await previewUrlForFile(file)
  return {
    src: previewUrl,
    alt: currentAlt?.trim() ? currentAlt : file.name.replace(/\.[^/.]+$/, '') || labelFallback,
    file,
  }
}

const compactInputClass =
  'w-full h-8 min-w-0 px-2 rounded-md border border-gray-200 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-300/60'

export function CampaignUploadTile({
  label,
  hint,
  aspect,
  uploadMode = 'defer',
  altPlaceholder,
  allowMultiple,
  compact = false,
  value,
  onChange,
  onAddMany,
  onRemove,
}: {
  label: string
  hint: string
  aspect?: 'banner' | 'square' | 'wide' | 'tall'
  uploadMode?: 'immediate' | 'defer'
  altPlaceholder?: string
  allowMultiple?: boolean
  compact?: boolean
  value?: { src: string; alt: string; file?: File }
  onChange?: (next: { src: string; alt: string; file?: File }) => void
  onAddMany?: (items: { src: string; alt: string; file: File }[]) => void
  onRemove?: () => void
}) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const clearLocalSelection = () => {
    if (!onChange) return
    try {
      if (value?.src && typeof value.src === 'string' && value.src.startsWith('blob:')) URL.revokeObjectURL(value.src)
    } catch {
      // ignore
    }
    setUploadError(null)
    onChange({ src: '', alt: '', file: undefined })
  }

  const aspectClass =
    aspect === 'banner' ? 'aspect-[16/7]' : aspect === 'wide' ? 'aspect-[16/10]' : aspect === 'tall' ? 'aspect-[3/4]' : 'aspect-square'

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length || !onChange) return
    setUploadError(null)
    const first = files[0]!
    const rest = files.slice(1)
    if (uploadMode === 'defer') {
      try {
        const firstValue = await buildImageValueFromFile(first, label, value?.alt)
        onChange(firstValue)
        if (allowMultiple && rest.length && onAddMany) {
          const more = await Promise.all(rest.map((f) => buildImageValueFromFile(f, label, undefined)))
          onAddMany(more)
        }
      } catch (err) {
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Preview generation failed'
        setUploadError(msg)
      }
      return
    }
    setUploading(true)
    try {
      const absoluteUrl = await apiUploadImage(first, { draft: true })
      onChange({ src: absoluteUrl, alt: value?.alt?.trim() ? value.alt : first.name.replace(/\.[^/.]+$/, '') || label })
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Upload failed'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-gray-900">{label}</span>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            {value?.file ? (
              <button
                type="button"
                onClick={clearLocalSelection}
                className="h-7 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-800 hover:bg-gray-50"
              >
                Clear
              </button>
            ) : null}
            {onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="h-7 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-800 hover:bg-gray-50"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
            {value?.src ? (
              <img src={value.src} alt={value.alt || label} className="h-full w-full object-cover" />
            ) : value?.file ? (
              <div className="flex h-full items-center justify-center p-1 text-center text-[10px] leading-tight text-gray-500">File</div>
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-gray-400">—</div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {onChange ? (
              <>
                <input
                  className={compactInputClass}
                  placeholder="Image URL"
                  value={value?.src ?? ''}
                  onChange={(e) => onChange({ src: e.target.value, alt: value?.alt ?? '', file: value?.file })}
                />
                <input
                  className={compactInputClass}
                  placeholder={altPlaceholder ?? 'Alt'}
                  value={value?.alt ?? ''}
                  onChange={(e) => onChange({ src: value?.src ?? '', alt: e.target.value, file: value?.file })}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input id={inputId} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFileChange} multiple={Boolean(allowMultiple)} />
                  <label
                    htmlFor={inputId}
                    className={
                      uploading
                        ? 'inline-flex h-7 cursor-wait items-center rounded-md border border-gray-200 bg-gray-100 px-2 text-[11px] font-semibold text-gray-500'
                        : 'inline-flex h-7 cursor-pointer items-center rounded-md border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-900 hover:bg-gray-50'
                    }
                  >
                    {uploadMode === 'defer' ? 'Upload' : uploading ? '…' : 'Upload'}
                  </label>
                  {value?.file ? (
                    <span className="max-w-[140px] truncate text-[10px] text-gray-500" title={value.file.name}>
                      {value.file.name}
                    </span>
                  ) : null}
                </div>
              </>
            ) : null}
            {uploadError ? <div className="text-[11px] text-rose-600">{uploadError}</div> : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          <div className="mt-1 text-xs text-gray-600">{hint}</div>
          {value?.file ? (
            <div className="mt-2 text-[11px] font-semibold text-gray-700">
              Selected file: <span className="font-mono font-medium">{value.file.name}</span>
              {isLikelyTiff(value.file) ? <span className="ml-2 font-normal text-gray-500">(TIFF preview generated locally)</span> : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {value?.file ? (
            <button type="button" onClick={clearLocalSelection} className="h-8 whitespace-nowrap px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50">
              Unselect
            </button>
          ) : null}
          {onRemove ? (
            <button type="button" onClick={onRemove} className="h-8 whitespace-nowrap px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50">
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <div className={`mt-3 rounded-xl border border-gray-200 bg-white ${aspectClass} grid place-items-center overflow-hidden`}>
        {value?.src ? <img src={value.src} alt={value.alt || label} className="w-full h-full object-cover" /> : value?.file ? <div className="px-3 text-center text-gray-500 text-xs">File selected. It will upload when you save the campaign.</div> : <div className="text-gray-400 text-xs">Preview</div>}
      </div>
      {onChange ? (
        <div className="mt-3 grid grid-cols-1 gap-2">
          <input className={inputClassName()} placeholder="Image URL (paste or use Upload below)" value={value?.src ?? ''} onChange={(e) => onChange({ src: e.target.value, alt: value?.alt ?? '', file: value?.file })} />
          <input className={inputClassName()} placeholder={altPlaceholder ?? 'Alt text'} value={value?.alt ?? ''} onChange={(e) => onChange({ src: value?.src ?? '', alt: e.target.value, file: value?.file })} />
        </div>
      ) : null}
      {onChange ? (
        <div className="mt-3">
          <input id={inputId} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFileChange} multiple={Boolean(allowMultiple)} />
          <label htmlFor={inputId} className={uploading ? 'inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm font-semibold cursor-wait' : 'inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer'}>
            {uploadMode === 'defer' ? 'Select file' : uploading ? 'Uploading…' : 'Upload'}
          </label>
          {uploadError ? <div className="mt-2 text-xs text-rose-600">{uploadError}</div> : null}
        </div>
      ) : null}
    </div>
  )
}


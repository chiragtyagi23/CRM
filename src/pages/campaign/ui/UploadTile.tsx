import { useId, useState, type ChangeEvent } from 'react'

import { apiUploadImage } from '../../../lib/crmApi'
import { inputClassName } from './classNames'
import * as UTIF from 'utif'

function isLikelyTiff(file: File) {
  const name = file.name.toLowerCase()
  return file.type === 'image/tiff' || name.endsWith('.tif') || name.endsWith('.tiff')
}

async function previewUrlForFile(file: File): Promise<string> {
  // For most image types, the browser can preview directly.
  if (!isLikelyTiff(file)) return URL.createObjectURL(file)

  // TIFF needs decoding to a browser-friendly format for preview.
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

export function UploadTile({
  label,
  hint,
  aspect,
  uploadMode = 'defer',
  value,
  onChange,
  onRemove,
}: {
  label: string
  hint: string
  aspect?: 'banner' | 'square' | 'wide' | 'tall'
  uploadMode?: 'immediate' | 'defer'
  value?: { src: string; alt: string; file?: File }
  onChange?: (next: { src: string; alt: string; file?: File }) => void
  onRemove?: () => void
}) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const clearLocalSelection = () => {
    if (!onChange) return
    try {
      if (value?.src && typeof value.src === 'string' && value.src.startsWith('blob:')) {
        URL.revokeObjectURL(value.src)
      }
    } catch {
      // ignore
    }
    setUploadError(null)
    onChange({ src: '', alt: '', file: undefined })
  }

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
    if (uploadMode === 'defer') {
      let previewUrl = ''
      try {
        previewUrl = await previewUrlForFile(file)
      } catch (err) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Preview generation failed'
        setUploadError(msg)
        previewUrl = ''
      }
      onChange({
        src: previewUrl,
        alt: value?.alt?.trim() ? value.alt : file.name.replace(/\.[^/.]+$/, '') || label,
        file,
      })
      return
    }

    setUploading(true)
    try {
      const absoluteUrl = await apiUploadImage(file, { draft: true })
      onChange({
        src: absoluteUrl,
        alt: value?.alt?.trim() ? value.alt : file.name.replace(/\.[^/.]+$/, '') || label,
      })
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Upload failed'
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
          {value?.file ? (
            <div className="mt-2 text-[11px] font-semibold text-gray-700">
              Selected file: <span className="font-mono font-medium">{value.file.name}</span>
              {isLikelyTiff(value.file) ? <span className="ml-2 font-normal text-gray-500">(TIFF preview generated locally)</span> : null}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {value?.file ? (
            <button
              type="button"
              onClick={clearLocalSelection}
              className="h-8 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
            >
              Unselect
            </button>
          ) : null}
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
      </div>
      <div className={`mt-3 rounded-xl border border-gray-200 bg-white ${aspectClass} grid place-items-center overflow-hidden`}>
        {value?.src ? (
          <img src={value.src} alt={value.alt || label} className="w-full h-full object-cover" />
        ) : value?.file ? (
          <div className="px-3 text-center text-gray-500 text-xs">
            File selected. It will upload when you save the campaign.
          </div>
        ) : (
          <div className="text-gray-400 text-xs">Preview</div>
        )}
      </div>
      {onChange ? (
        <div className="mt-3 grid grid-cols-1 gap-2">
          <input
            className={inputClassName()}
            placeholder="Image URL (paste or use Upload below)"
            value={value?.src ?? ''}
            onChange={(e) => onChange({ src: e.target.value, alt: value?.alt ?? '', file: value?.file })}
          />
          <input
            className={inputClassName()}
            placeholder="Alt text"
            value={value?.alt ?? ''}
            onChange={(e) => onChange({ src: value?.src ?? '', alt: e.target.value, file: value?.file })}
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
            {uploadMode === 'defer' ? 'Select file' : uploading ? 'Uploading…' : 'Upload'}
          </label>
          {uploadError ? <div className="mt-2 text-xs text-rose-600">{uploadError}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

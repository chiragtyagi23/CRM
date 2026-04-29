import { useEffect, useId, useMemo, useState, type ChangeEvent } from 'react'

import { apiUploadVideo } from '../lib/crmApi'
import { inputClassName } from '../ui/campaign/classNames'

export function CampaignVideoTile({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: { url: string; file?: File }
  onChange: (next: { url: string; file?: File }) => void
}) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const localPreviewUrl = useMemo(() => {
    if (value.file) return URL.createObjectURL(value.file)
    return null
  }, [value.file])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const directUrl = String(value.url ?? '').trim()
  const canPreviewUrl = /\.(mp4|webm|ogg|ogv|m4v)(\?|#|$)/i.test(directUrl) || /\/uploads\//i.test(directUrl)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(null)
    onChange({ url: value.url, file })
  }

  const uploadNow = async () => {
    if (!value.file) return
    setUploading(true)
    setUploadError(null)
    try {
      const url = await apiUploadVideo(value.file)
      onChange({ url, file: undefined })
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Upload failed'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          <div className="mt-1 text-xs text-gray-600">{hint}</div>
          {value.file ? (
            <div className="mt-2 text-[11px] font-semibold text-gray-700">
              Selected file: <span className="font-mono font-medium">{value.file.name}</span>
              <span className="ml-2 font-normal text-gray-500">(uploads on Save)</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {value.file ? (
            <button
              type="button"
              className="h-8 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
              onClick={() => onChange({ url: value.url, file: undefined })}
              disabled={uploading}
            >
              Unselect
            </button>
          ) : null}
          {value.file ? (
            <button
              type="button"
              className="h-8 px-3 rounded-lg bg-[#80654a] text-white text-xs font-semibold hover:bg-[#725940] disabled:opacity-60"
              onClick={uploadNow}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload now'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <input className={inputClassName()} placeholder="Video URL (paste or upload below)" value={value.url} onChange={(e) => onChange({ url: e.target.value, file: value.file })} />
      </div>

      <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
        {localPreviewUrl ? (
          <div className="aspect-video bg-black">
            <video className="h-full w-full" controls preload="metadata" src={localPreviewUrl} />
          </div>
        ) : canPreviewUrl ? (
          <div className="aspect-video bg-black">
            <video className="h-full w-full" controls preload="metadata" src={directUrl} />
          </div>
        ) : directUrl ? (
          <div className="px-3 py-3 text-xs text-gray-600">Preview not available for this link. Use a direct video URL (mp4/webm) or upload a file.</div>
        ) : (
          <div className="px-3 py-8 text-center text-xs text-gray-400">Preview</div>
        )}
      </div>

      <div className="mt-3">
        <input id={inputId} type="file" accept="video/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        <label
          htmlFor={inputId}
          className={
            uploading
              ? 'inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm font-semibold cursor-wait'
              : 'inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer'
          }
        >
          Select video file
        </label>
        {uploadError ? <div className="mt-2 text-xs text-rose-600">{uploadError}</div> : null}
      </div>
    </div>
  )
}

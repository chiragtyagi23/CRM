/** Set while Bulk Upload page is mounted; used by AppHeader / beforeunload. */
let getDirty: (() => boolean) | null = null

export const BULK_UPLOAD_LEAVE_MESSAGE =
  'You have a file or parsed leads on this page. Leaving now may lose your work. Leave anyway?'

export function registerBulkUploadDirty(getter: () => boolean) {
  getDirty = getter
  return () => {
    getDirty = null
  }
}

export function isBulkUploadDirty() {
  return getDirty?.() ?? false
}

/** Call before navigating away from the app or logging out from Bulk Upload. */
export function confirmLeaveFromBulkUploadIfNeeded(pathname: string): boolean {
  if (pathname === '/leads/bulk-upload' && isBulkUploadDirty()) {
    return window.confirm(BULK_UPLOAD_LEAVE_MESSAGE)
  }
  return true
}

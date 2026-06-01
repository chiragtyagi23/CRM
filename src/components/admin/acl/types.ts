export type AclToastFn = (message: string, type?: 'success' | 'error') => void

/** Shared props for tabs that use search + pagination + DataTable */
export type AclPaginatedTabProps = {
  search: string
  page: number
  onPageChange: (page: number) => void
  loading: boolean
  toast: AclToastFn
}

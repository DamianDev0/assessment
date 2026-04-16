export interface PaginationState {
  cursor: string | null
  pageSize: number
  hasMore: boolean
}

export interface SortConfig<T> {
  field: keyof T
  direction: 'asc' | 'desc'
}

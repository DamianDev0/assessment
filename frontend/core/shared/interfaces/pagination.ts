export interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface SortConfig<T> {
  field: keyof T
  direction: 'asc' | 'desc'
}

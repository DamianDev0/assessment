import type { ReactNode } from "react"

export interface DataTableColumn<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  className?: string
  sortable?: boolean
  sortKey?: string
}

export interface DataTableAction {
  label: string
  value: string
}

export interface DataTablePagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

export interface DataTableProps<T> {
  data: readonly T[]
  columns: readonly DataTableColumn<T>[]
  onRowAction?: (action: string, item: T) => void
  onRowClick?: (item: T) => void
  actions?: DataTableAction[] | ((item: T) => DataTableAction[])
  pagination?: DataTablePagination
  emptyMessage?: string
  isLoading?: boolean
  onSort?: (field: string) => void
  sortField?: string | null
  sortDirection?: "asc" | "desc"
  expandable?: boolean
  renderExpandedRow?: (item: T) => ReactNode
  rowClassName?: (item: T) => string | undefined
}

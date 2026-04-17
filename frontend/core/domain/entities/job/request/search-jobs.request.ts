export interface SearchJobsRequest {
  statuses?: string[]
  dateFrom?: string
  dateTo?: string
  assigneeId?: string
  searchTerm?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface SearchJobsRequest {
  statuses?: string[]
  dateFrom?: string
  dateTo?: string
  assigneeId?: string
  searchTerm?: string
  cursor?: string
  limit?: number
}

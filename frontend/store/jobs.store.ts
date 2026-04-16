import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Job, JobFilters } from '@/core/domain/entities/job'
import type { JobStatus } from '@/core/shared/enums/job-status.enum'
import type { PaginationState, SortConfig } from '@/core/shared/interfaces/pagination'

interface JobsState {
  jobs: Job[]
  selectedJobIds: Set<string>
  filters: JobFilters
  pagination: PaginationState
  sortConfig: SortConfig<Job>
}

interface JobsActions {
  setJobs: (jobs: Job[]) => void
  appendJobs: (jobs: Job[]) => void
  updateJobStatusOptimistic: (jobId: string, newStatus: JobStatus) => void
  rollbackJobStatus: (jobId: string, previousStatus: JobStatus) => void
  setFilters: (filters: Partial<JobFilters>) => void
  resetFilters: () => void
  toggleJobSelection: (jobId: string) => void
  clearSelection: () => void
  setCursor: (cursor: string | null, hasMore: boolean) => void
  setSortConfig: (config: SortConfig<Job>) => void
}

const DEFAULT_FILTERS: JobFilters = {
  status: null,
  dateFrom: null,
  dateTo: null,
  assigneeId: null,
  searchTerm: null,
}

export const useJobsStore = create<JobsState & JobsActions>()(
  immer((set) => ({
    jobs: [],
    selectedJobIds: new Set(),
    filters: { ...DEFAULT_FILTERS },
    pagination: { cursor: null, pageSize: 20, hasMore: true },
    sortConfig: { field: 'createdAt', direction: 'desc' },

    setJobs: (jobs) =>
      set((state) => {
        state.jobs = jobs
      }),

    appendJobs: (jobs) =>
      set((state) => {
        state.jobs.push(...jobs)
      }),

    updateJobStatusOptimistic: (jobId, newStatus) =>
      set((state) => {
        const job = state.jobs.find((j) => j.id === jobId)
        if (job) job.status = newStatus
      }),

    rollbackJobStatus: (jobId, previousStatus) =>
      set((state) => {
        const job = state.jobs.find((j) => j.id === jobId)
        if (job) job.status = previousStatus
      }),

    setFilters: (filters) =>
      set((state) => {
        Object.assign(state.filters, filters)
        state.pagination.cursor = null
        state.pagination.hasMore = true
      }),

    resetFilters: () =>
      set((state) => {
        state.filters = { ...DEFAULT_FILTERS }
        state.pagination.cursor = null
        state.pagination.hasMore = true
      }),

    toggleJobSelection: (jobId) =>
      set((state) => {
        if (state.selectedJobIds.has(jobId)) {
          state.selectedJobIds.delete(jobId)
        } else {
          state.selectedJobIds.add(jobId)
        }
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedJobIds.clear()
      }),

    setCursor: (cursor, hasMore) =>
      set((state) => {
        state.pagination.cursor = cursor
        state.pagination.hasMore = hasMore
      }),

    setSortConfig: (config) =>
      set((state) => {
        state.sortConfig = config
      }),
  }))
)

const matchesStatus = (job: Job, status: JobStatus | null): boolean =>
  !status || job.status === status

const matchesAssignee = (job: Job, assigneeId: string | null): boolean =>
  !assigneeId || job.assigneeId === assigneeId

const matchesSearch = (job: Job, searchTerm: string | null): boolean => {
  if (!searchTerm) return true
  const term = searchTerm.toLowerCase()
  return job.title.toLowerCase().includes(term) || job.description.toLowerCase().includes(term)
}

const matchesDateRange = (job: Job, dateFrom: Date | null, dateTo: Date | null): boolean => {
  if (!job.scheduledDate) return true
  const scheduled = new Date(job.scheduledDate)
  if (dateFrom && scheduled < dateFrom) return false
  if (dateTo && scheduled > dateTo) return false
  return true
}

export const selectFilteredJobs = (state: JobsState): Job[] => {
  const { jobs, filters } = state
  return jobs.filter((job) =>
    matchesStatus(job, filters.status) &&
    matchesAssignee(job, filters.assigneeId) &&
    matchesSearch(job, filters.searchTerm) &&
    matchesDateRange(job, filters.dateFrom, filters.dateTo)
  )
}

export const selectFilters = (state: JobsState) => state.filters
export const selectPagination = (state: JobsState) => state.pagination
export const selectSelectedJobIds = (state: JobsState) => state.selectedJobIds
export const selectSortConfig = (state: JobsState) => state.sortConfig

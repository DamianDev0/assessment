import { describe, it, expect, beforeEach } from 'vitest'
import { useJobsStore, selectFilteredJobs } from '@/store/jobs.store'
import { JobStatus } from '@/core/shared/enums/job-status.enum'
import type { Job } from '@/core/domain/entities/job'

const mockJob = (overrides: Partial<Job> = {}): Job => ({
  id: crypto.randomUUID(),
  title: 'Fix Roof',
  description: '',
  status: JobStatus.DRAFT,
  street: '123 Main St',
  city: 'Miami',
  state: 'FL',
  zipCode: '33101',
  latitude: 25.77,
  longitude: -80.19,
  scheduledDate: null,
  assigneeId: null,
  customerId: crypto.randomUUID(),
  organizationId: crypto.randomUUID(),
  photoCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('useJobsStore', () => {
  beforeEach(() => {
    useJobsStore.setState({
      jobs: [],
      filters: { status: null, dateFrom: null, dateTo: null, assigneeId: null, searchTerm: null },
      selectedJobIds: new Set(),
      pagination: { currentPage: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      sortConfig: { field: 'createdAt', direction: 'desc' },
    })
  })

  it('setJobs replaces all jobs', () => {
    const jobs = [mockJob(), mockJob()]
    useJobsStore.getState().setJobs(jobs)
    expect(useJobsStore.getState().jobs).toHaveLength(2)
  })

  it('updateJobStatusOptimistic updates the status', () => {
    const job = mockJob({ status: JobStatus.IN_PROGRESS })
    useJobsStore.getState().setJobs([job])

    useJobsStore.getState().updateJobStatusOptimistic(job.id, JobStatus.COMPLETED)

    expect(useJobsStore.getState().jobs[0].status).toBe(JobStatus.COMPLETED)
  })

  it('rollbackJobStatus reverts status after failed API call', () => {
    const job = mockJob({ status: JobStatus.IN_PROGRESS })
    useJobsStore.getState().setJobs([job])

    useJobsStore.getState().updateJobStatusOptimistic(job.id, JobStatus.COMPLETED)
    useJobsStore.getState().rollbackJobStatus(job.id, JobStatus.IN_PROGRESS)

    expect(useJobsStore.getState().jobs[0].status).toBe(JobStatus.IN_PROGRESS)
  })

  it('selectFilteredJobs filters by status', () => {
    const jobs = [
      mockJob({ status: JobStatus.DRAFT }),
      mockJob({ status: JobStatus.COMPLETED }),
      mockJob({ status: JobStatus.DRAFT }),
    ]
    useJobsStore.getState().setJobs(jobs)
    useJobsStore.getState().setFilters({ status: JobStatus.DRAFT })

    const state = useJobsStore.getState()
    const filtered = selectFilteredJobs(state)
    expect(filtered).toHaveLength(2)
    expect(filtered.every((j) => j.status === JobStatus.DRAFT)).toBe(true)
  })

  it('selectFilteredJobs filters by search term', () => {
    const jobs = [
      mockJob({ title: 'Fix Roof' }),
      mockJob({ title: 'Install Gutters' }),
    ]
    useJobsStore.getState().setJobs(jobs)
    useJobsStore.getState().setFilters({ searchTerm: 'roof' })

    const state = useJobsStore.getState()
    const filtered = selectFilteredJobs(state)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('Fix Roof')
  })

  it('resetFilters clears all filters', () => {
    useJobsStore.getState().setFilters({ status: JobStatus.COMPLETED, searchTerm: 'test' })
    useJobsStore.getState().resetFilters()

    const { filters } = useJobsStore.getState()
    expect(filters.status).toBeNull()
    expect(filters.searchTerm).toBeNull()
  })
})

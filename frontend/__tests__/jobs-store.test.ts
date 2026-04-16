import { describe, it, expect, beforeEach } from 'vitest'
import { useJobsStore, selectFilteredJobs } from '@/store/jobs.store'
import type { Job } from '@/core/domain/entities/job'

const mockJob = (overrides: Partial<Job> = {}): Job => ({
  id: crypto.randomUUID(),
  title: 'Fix Roof',
  description: '',
  status: 'draft',
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
      pagination: { cursor: null, pageSize: 20, hasMore: true },
      sortConfig: { field: 'createdAt', direction: 'desc' },
    })
  })

  it('setJobs replaces all jobs', () => {
    const jobs = [mockJob(), mockJob()]
    useJobsStore.getState().setJobs(jobs)
    expect(useJobsStore.getState().jobs).toHaveLength(2)
  })

  it('updateJobStatusOptimistic updates the status', () => {
    const job = mockJob({ status: 'in_progress' })
    useJobsStore.getState().setJobs([job])

    useJobsStore.getState().updateJobStatusOptimistic(job.id, 'completed')

    expect(useJobsStore.getState().jobs[0].status).toBe('completed')
  })

  it('rollbackJobStatus reverts status after failed API call', () => {
    const job = mockJob({ status: 'in_progress' })
    useJobsStore.getState().setJobs([job])

    useJobsStore.getState().updateJobStatusOptimistic(job.id, 'completed')
    useJobsStore.getState().rollbackJobStatus(job.id, 'in_progress')

    expect(useJobsStore.getState().jobs[0].status).toBe('in_progress')
  })

  it('selectFilteredJobs filters by status', () => {
    const jobs = [
      mockJob({ status: 'draft' }),
      mockJob({ status: 'completed' }),
      mockJob({ status: 'draft' }),
    ]
    useJobsStore.getState().setJobs(jobs)
    useJobsStore.getState().setFilters({ status: 'draft' })

    const state = useJobsStore.getState()
    const filtered = selectFilteredJobs(state)
    expect(filtered).toHaveLength(2)
    expect(filtered.every((j) => j.status === 'draft')).toBe(true)
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
    useJobsStore.getState().setFilters({ status: 'completed', searchTerm: 'test' })
    useJobsStore.getState().resetFilters()

    const { filters } = useJobsStore.getState()
    expect(filters.status).toBeNull()
    expect(filters.searchTerm).toBeNull()
  })
})

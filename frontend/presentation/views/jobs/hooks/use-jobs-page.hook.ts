'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import { useJobsStore, selectFilters, selectPagination } from '@/store/jobs.store'
import { clientContainer } from '@/core/infrastructure/container/client-container'
import { JobStatus } from '@/core/shared/enums/job-status.enum'
import { useCreateJob } from '../features/create-job'
import { useCompleteJob } from '../features/complete-job'
import { useScheduleJob } from '../features/schedule-job'
import { useFilterJobs } from '../features/filter-jobs'
import type { Job } from '@/core/domain/entities/job'
import type { DataTablePagination } from '@/components/types/data-table.types'

interface StatusMutationContext {
  previousStatus: JobStatus | null
}

export function useJobsPage(
  initialJobs: readonly Job[],
  initialTotalCount: number,
  initialTotalPages: number,
  initialCurrentPage: number,
  initialPageSize: number,
) {
  const router = useRouter()
  const { setJobs, setPagination, updateJobStatusOptimistic, rollbackJobStatus } = useJobsStore()
  const jobs = useJobsStore((s) => s.jobs)
  const filters = useJobsStore(selectFilters)
  const pagination = useJobsStore(selectPagination)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isSearching, setIsSearching] = useState(false)
  const initializedRef = useRef(false)
  const skipFirstFetchRef = useRef(true)

  useEffect(() => {
    setJobs(initialJobs as Job[])
    setPagination({
      currentPage: initialCurrentPage ?? 1,
      pageSize: initialPageSize ?? 10,
      totalItems: initialTotalCount ?? 0,
      totalPages: initialTotalPages ?? 0,
    })
    initializedRef.current = true
  }, [initialJobs, initialTotalCount, initialTotalPages, initialCurrentPage, initialPageSize, setJobs, setPagination])

  const fetchJobs = useCallback(async (page: number) => {
    setIsSearching(true)
    try {
      const currentFilters = useJobsStore.getState().filters
      const currentPageSize = useJobsStore.getState().pagination.pageSize
      const result = await clientContainer.searchJobs.execute({
        statuses: currentFilters.status ? [currentFilters.status] : undefined,
        searchTerm: currentFilters.searchTerm ?? undefined,
        dateFrom: currentFilters.dateFrom?.toISOString(),
        dateTo: currentFilters.dateTo?.toISOString(),
        assigneeId: currentFilters.assigneeId ?? undefined,
        sortField: sortField ?? undefined,
        sortDirection: sortField ? sortDirection : undefined,
        page,
        pageSize: currentPageSize,
      })
      setJobs(result.items)
      setPagination({
        currentPage: result.currentPage,
        totalItems: result.totalCount,
        totalPages: result.totalPages,
      })
    } finally {
      setIsSearching(false)
    }
  }, [sortField, sortDirection, setJobs, setPagination])

  useEffect(() => {
    if (!initializedRef.current) return
    if (skipFirstFetchRef.current) {
      skipFirstFetchRef.current = false
      return
    }
    fetchJobs(1)
  }, [filters.status, filters.searchTerm, filters.dateFrom, filters.dateTo, filters.assigneeId, sortField, sortDirection, fetchJobs])

  const handlePageChange = useCallback((page: number) => {
    fetchJobs(page)
  }, [fetchJobs])

  const handleItemsPerPageChange = useCallback((pageSize: number) => {
    setPagination({ pageSize, currentPage: 1 })
    fetchJobs(1)
  }, [setPagination, fetchJobs])

  const tablePagination: DataTablePagination = {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    itemsPerPage: pagination.pageSize,
    onPageChange: handlePageChange,
    onItemsPerPageChange: handleItemsPerPageChange,
  }

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  const handleMutationSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  const startMutation = useMutation<void, Error, string, StatusMutationContext>({
    mutationFn: (jobId) => clientContainer.startJob.execute(jobId),
    onMutate: (jobId) => {
      const prev = useJobsStore.getState().jobs.find((j) => j.id === jobId)?.status ?? null
      updateJobStatusOptimistic(jobId, JobStatus.IN_PROGRESS)
      return { previousStatus: prev }
    },
    onSuccess: () => { sileo.success({ title: 'Job started' }); handleMutationSuccess() },
    onError: (error, jobId, ctx) => {
      if (ctx?.previousStatus) rollbackJobStatus(jobId, ctx.previousStatus)
      sileo.error({ title: 'Failed', description: error.message })
    },
  })

  const cancelMutation = useMutation<void, Error, string, StatusMutationContext>({
    mutationFn: (jobId) => clientContainer.cancelJob.execute(jobId, 'Cancelled by user'),
    onMutate: (jobId) => {
      const prev = useJobsStore.getState().jobs.find((j) => j.id === jobId)?.status ?? null
      updateJobStatusOptimistic(jobId, JobStatus.CANCELLED)
      return { previousStatus: prev }
    },
    onSuccess: () => { sileo.success({ title: 'Job cancelled' }); handleMutationSuccess() },
    onError: (error, jobId, ctx) => {
      if (ctx?.previousStatus) rollbackJobStatus(jobId, ctx.previousStatus)
      sileo.error({ title: 'Failed', description: error.message })
    },
  })

  const createJob = useCreateJob(handleMutationSuccess)
  const completeJob = useCompleteJob(handleMutationSuccess)
  const scheduleJob = useScheduleJob(handleMutationSuccess)
  const filterJobs = useFilterJobs()

  const handleRowAction = useCallback((action: string, job: Job) => {
    switch (action) {
      case 'schedule': scheduleJob.openModal(job.id); break
      case 'start': startMutation.mutate(job.id); break
      case 'complete': completeJob.openModal(job.id); break
      case 'cancel': cancelMutation.mutate(job.id); break
    }
  }, [scheduleJob, startMutation, completeJob, cancelMutation])

  return {
    jobs,
    filters,
    tablePagination,
    isSearching,
    sortField,
    sortDirection,
    createJob,
    completeJob,
    scheduleJob,
    filterJobs,
    handleRowAction,
    handleSort,
  }
}

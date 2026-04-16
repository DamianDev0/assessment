'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import { useShallow } from 'zustand/react/shallow'
import { useJobsStore, selectFilteredJobs, selectFilters } from '@/store/jobs.store'
import { jobService } from '@/core/infrastructure/services/job.service'
import { useCreateJob } from '../features/create-job'
import { useCompleteJob } from '../features/complete-job'
import { useScheduleJob } from '../features/schedule-job'
import { useFilterJobs } from '../features/filter-jobs'
import type { Job } from '@/core/domain/entities/job'

export function useJobsPage(initialJobs: readonly Job[]) {
  const router = useRouter()
  const { setJobs, updateJobStatusOptimistic, rollbackJobStatus } = useJobsStore()
  const jobs = useJobsStore(useShallow(selectFilteredJobs))
  const filters = useJobsStore(selectFilters)

  useEffect(() => {
    setJobs(initialJobs as Job[])
  }, [initialJobs, setJobs])

  const handleMutationSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  const startMutation = useMutation({
    mutationFn: (jobId: string) => {
      updateJobStatusOptimistic(jobId, 'InProgress')
      return jobService.start(jobId)
    },
    onSuccess: () => { sileo.success({ title: 'Job started' }); handleMutationSuccess() },
    onError: (error: Error, jobId: string) => { rollbackJobStatus(jobId, 'Scheduled'); sileo.error({ title: 'Failed', description: error.message }) },
  })

  const cancelMutation = useMutation({
    mutationFn: (jobId: string) => {
      updateJobStatusOptimistic(jobId, 'Cancelled')
      return jobService.cancel(jobId, 'Cancelled by user')
    },
    onSuccess: () => { sileo.success({ title: 'Job cancelled' }); handleMutationSuccess() },
    onError: (error: Error, jobId: string) => { rollbackJobStatus(jobId, 'Draft'); sileo.error({ title: 'Failed', description: error.message }) },
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

  return { jobs, filters, createJob, completeJob, scheduleJob, filterJobs, handleRowAction }
}

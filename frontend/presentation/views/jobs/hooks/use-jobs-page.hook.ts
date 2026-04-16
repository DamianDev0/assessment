'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import { useShallow } from 'zustand/react/shallow'
import { useJobsStore, selectFilteredJobs, selectFilters } from '@/store/jobs.store'
import { clientContainer } from '@/core/infrastructure/container/client-container'
import { JobStatus } from '@/core/shared/enums/job-status.enum'
import { useCreateJob } from '../features/create-job'
import { useCompleteJob } from '../features/complete-job'
import { useScheduleJob } from '../features/schedule-job'
import { useFilterJobs } from '../features/filter-jobs'
import type { Job } from '@/core/domain/entities/job'

interface StatusMutationContext {
  previousStatus: JobStatus | null
}

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

  const startMutation = useMutation<void, Error, string, StatusMutationContext>({
    mutationFn: (jobId) => clientContainer.startJob.execute(jobId),
    onMutate: (jobId) => {
      const previousStatus = useJobsStore.getState().jobs.find((j) => j.id === jobId)?.status ?? null
      updateJobStatusOptimistic(jobId, JobStatus.IN_PROGRESS)
      return { previousStatus }
    },
    onSuccess: () => { sileo.success({ title: 'Job started' }); handleMutationSuccess() },
    onError: (error, jobId, context) => {
      if (context?.previousStatus) rollbackJobStatus(jobId, context.previousStatus)
      sileo.error({ title: 'Failed', description: error.message })
    },
  })

  const cancelMutation = useMutation<void, Error, string, StatusMutationContext>({
    mutationFn: (jobId) => clientContainer.cancelJob.execute(jobId, 'Cancelled by user'),
    onMutate: (jobId) => {
      const previousStatus = useJobsStore.getState().jobs.find((j) => j.id === jobId)?.status ?? null
      updateJobStatusOptimistic(jobId, JobStatus.CANCELLED)
      return { previousStatus }
    },
    onSuccess: () => { sileo.success({ title: 'Job cancelled' }); handleMutationSuccess() },
    onError: (error, jobId, context) => {
      if (context?.previousStatus) rollbackJobStatus(jobId, context.previousStatus)
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

  return { jobs, filters, createJob, completeJob, scheduleJob, filterJobs, handleRowAction }
}

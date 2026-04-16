'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import { clientContainer } from '@/core/infrastructure/container/client-container'
import { useJobsStore } from '@/store/jobs.store'
import { JobStatus } from '@/core/shared/enums/job-status.enum'

interface Variables {
  jobId: string
  date: Date
  assigneeId: string
}

interface Context {
  previousStatus: JobStatus | null
}

export function useScheduleJob(onSuccess: () => void) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { updateJobStatusOptimistic, rollbackJobStatus } = useJobsStore()

  const mutation = useMutation<void, Error, Variables, Context>({
    mutationFn: ({ jobId, date, assigneeId }) =>
      clientContainer.scheduleJob.execute(jobId, date.toISOString(), assigneeId),
    onMutate: ({ jobId }) => {
      const previousStatus = useJobsStore.getState().jobs.find((j) => j.id === jobId)?.status ?? null
      updateJobStatusOptimistic(jobId, JobStatus.SCHEDULED)
      return { previousStatus }
    },
    onSuccess: () => {
      setIsModalOpen(false)
      setSelectedJobId(null)
      sileo.success({ title: 'Job scheduled' })
      onSuccess()
    },
    onError: (error, variables, context) => {
      if (context?.previousStatus) rollbackJobStatus(variables.jobId, context.previousStatus)
      sileo.error({ title: 'Failed to schedule', description: error.message })
    },
  })

  const openModal = useCallback((jobId: string) => {
    setSelectedJobId(jobId)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedJobId(null)
  }, [])

  const handleSubmit = useCallback((date: Date, assigneeId: string) => {
    if (!selectedJobId) return
    mutation.mutate({ jobId: selectedJobId, date, assigneeId })
  }, [selectedJobId, mutation])

  return {
    isModalOpen,
    selectedJobId,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
    openModal,
    closeModal,
    handleSubmit,
  }
}

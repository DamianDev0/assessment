'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import { jobService } from '@/core/infrastructure/services/job.service'
import { useJobsStore } from '@/store/jobs.store'

export function useScheduleJob(onSuccess: () => void) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { updateJobStatusOptimistic, rollbackJobStatus } = useJobsStore()

  const mutation = useMutation({
    mutationFn: ({ jobId, date, assigneeId }: { jobId: string; date: Date; assigneeId: string }) => {
      updateJobStatusOptimistic(jobId, 'Scheduled')
      return jobService.schedule(jobId, date.toISOString(), assigneeId)
    },
    onSuccess: () => {
      setIsModalOpen(false)
      setSelectedJobId(null)
      sileo.success({ title: 'Job scheduled' })
      onSuccess()
    },
    onError: (error: Error) => {
      if (selectedJobId) rollbackJobStatus(selectedJobId, 'Draft')
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

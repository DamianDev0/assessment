'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import { clientContainer } from '@/core/infrastructure/di/client-container'
import { useJobsStore } from '@/store/jobs.store'

export function useCompleteJob(onSuccess: () => void) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { updateJobStatusOptimistic, rollbackJobStatus } = useJobsStore()

  const mutation = useMutation({
    mutationFn: (signatureUrl: string) => {
      if (!selectedJobId) throw new Error('No job selected')
      updateJobStatusOptimistic(selectedJobId, 'Completed')
      return clientContainer.completeJob.execute(selectedJobId, { signatureUrl })
    },
    onSuccess: () => {
      setIsModalOpen(false)
      setSelectedJobId(null)
      sileo.success({ title: 'Job completed', description: 'Invoice generation has been triggered.' })
      onSuccess()
    },
    onError: (error: Error) => {
      if (selectedJobId) rollbackJobStatus(selectedJobId, 'InProgress')
      sileo.error({ title: 'Failed to complete job', description: error.message })
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

  return {
    isModalOpen,
    selectedJobId,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
    openModal,
    closeModal,
    handleSubmit: mutation.mutate,
  }
}

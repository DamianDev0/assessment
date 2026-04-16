'use client'

import { useMemo } from 'react'
import { useJobsStore, selectFilters } from '@/store/jobs.store'
import type { JobFilters } from '@/core/domain/entities/job'

export function useFilterJobs() {
  const { setFilters, resetFilters } = useJobsStore()
  const filters = useJobsStore(selectFilters)

  const hasActiveFilters = useMemo(() =>
    Boolean(filters.status || filters.dateFrom || filters.dateTo || filters.assigneeId || filters.searchTerm),
    [filters]
  )

  const handleFilterChange = (partial: Partial<JobFilters>) => {
    setFilters(partial)
  }

  return {
    filters,
    hasActiveFilters,
    handleFilterChange,
    resetFilters,
  }
}

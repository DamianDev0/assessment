'use client'

import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useJobsPage } from '../../hooks/use-jobs-page.hook'
import { CreateJobModal } from '../../features/create-job'
import { CompleteJobModal } from '../../features/complete-job'
import { ScheduleJobModal } from '../../features/schedule-job'
import { FilterBar } from '../../features/filter-jobs'
import { DataTable } from '@/components/organisms/data-table'
import { ErrorBoundary } from '@/components/organisms/error-boundary'
import { Button } from '@/components/shadcn/button'
import { ThemeToggle } from '@/components/atoms/theme-toggle'
import { getJobsColumns, getJobActions } from '../../config/jobs-columns.config'
import type { Job } from '@/core/domain/entities/job'

interface JobsClientProps {
  readonly initialJobs: readonly Job[]
  readonly nextCursor: string | null
  readonly hasMore: boolean
}

export function JobsClient(props: Readonly<JobsClientProps>) {
  const { initialJobs } = props
  const { jobs, filters, createJob, completeJob, scheduleJob, filterJobs, handleRowAction } = useJobsPage(initialJobs as Job[])

  const columns = useMemo(() => getJobsColumns(), [])

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-[510] tracking-tight text-foreground">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and track roofing jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={createJob.openModal} size="sm" data-testid="create-job-button">
            <Plus className="h-4 w-4" />
            New Job
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <FilterBar onFilterChange={filterJobs.handleFilterChange} onReset={filterJobs.resetFilters} hasActiveFilters={filterJobs.hasActiveFilters}>
        <FilterBar.Status value={filters.status} />
        <FilterBar.DateRange dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
        <FilterBar.Search value={filters.searchTerm} />
      </FilterBar>

      <ErrorBoundary>
        <div data-testid="jobs-table">
          <DataTable
            data={jobs}
            columns={columns}
            actions={getJobActions}
            onRowAction={handleRowAction}
            emptyMessage="No jobs found"
          />
        </div>
      </ErrorBoundary>

      <CreateJobModal
        isOpen={createJob.isModalOpen}
        onClose={createJob.closeModal}
        onFormSubmit={createJob.handleFormSubmit}
        isLoading={createJob.isLoading}
        fieldErrors={createJob.fieldErrors}
        address={createJob.address}
        selectedAddress={createJob.selectedAddress}
        onAddressSelect={createJob.handleAddressSelect}
        defaultCustomerId={createJob.defaultCustomerId}
      />

      <ScheduleJobModal
        isOpen={scheduleJob.isModalOpen}
        jobId={scheduleJob.selectedJobId}
        onClose={scheduleJob.closeModal}
        onSubmit={scheduleJob.handleSubmit}
        isLoading={scheduleJob.isLoading}
        error={scheduleJob.error}
      />

      <CompleteJobModal
        isOpen={completeJob.isModalOpen}
        jobId={completeJob.selectedJobId}
        onClose={completeJob.closeModal}
        onSubmit={completeJob.handleSubmit}
        isLoading={completeJob.isLoading}
        error={completeJob.error}
      />
    </div>
  )
}

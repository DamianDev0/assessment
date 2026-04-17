"use client";

import { useMemo } from "react";
import { useJobsPage } from "../../hooks/use-jobs-page.hook";
import { CreateJobModal } from "../../features/create-job";
import { CompleteJobModal } from "../../features/complete-job";
import { ScheduleJobModal } from "../../features/schedule-job";
import { FilterBar } from "../../features/filter-jobs";
import { JobsHeader } from "../molecules/jobs-header.component";
import { DataTable } from "@/components/organisms/data-table";
import { ErrorBoundary } from "@/components/organisms/error-boundary";
import {
  getJobsColumns,
  getJobActions,
} from "../../config/jobs-columns.config";
import type { Job } from "@/core/domain/entities/job";

interface JobsClientProps {
  readonly initialJobs: readonly Job[];
  readonly totalCount: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly pageSize: number;
}

export function JobsClient({
  initialJobs,
  totalCount,
  totalPages,
  currentPage,
  pageSize,
}: Readonly<JobsClientProps>) {
  const {
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
  } = useJobsPage(
    initialJobs as Job[],
    totalCount,
    totalPages,
    currentPage,
    pageSize,
  );

  const columns = useMemo(() => getJobsColumns(), []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-4">
      <JobsHeader onCreateJob={createJob.openModal} />

      <FilterBar
        onFilterChange={filterJobs.handleFilterChange}
        onReset={filterJobs.resetFilters}
        hasActiveFilters={filterJobs.hasActiveFilters}
      >
        <FilterBar.Status value={filters.status} />
        <FilterBar.DateRange
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
        />
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
            isLoading={isSearching}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            pagination={tablePagination}
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
  );
}

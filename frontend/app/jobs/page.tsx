import 'server-only'
import type { Metadata } from 'next'
import { JobsClient } from '@/presentation/views/jobs'
import { container } from '@/core/infrastructure/container/server-container'

export const metadata: Metadata = {
  title: 'Jobs | JobTracker',
  description: 'View, create and manage roofing jobs',
}

export default async function JobsPage() {
  const response = await container.getJobsUseCase.execute({ pageSize: 10 })

  return (
    <JobsClient
      initialJobs={response.items ?? []}
      totalCount={response.totalCount ?? 0}
      totalPages={response.totalPages ?? 0}
      currentPage={response.currentPage ?? 1}
      pageSize={response.pageSize ?? 10}
    />
  )
}

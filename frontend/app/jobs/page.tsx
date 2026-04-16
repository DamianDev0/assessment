import 'server-only'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Jobs | JobTracker',
  description: 'View, create and manage roofing jobs',
}
import { JobsClient } from '@/presentation/views/jobs'
import { JobsSkeleton } from '@/presentation/views/jobs/components/organisms/jobs-skeleton.component'
import { container } from '@/core/infrastructure/container/server-container'

export default async function JobsPage() {
  const response = await container.getJobsUseCase.execute()

  return (
    <Suspense fallback={<JobsSkeleton />}>
      <JobsClient
        initialJobs={response.items}
        nextCursor={response.nextCursor}
        hasMore={response.hasMore}
      />
    </Suspense>
  )
}

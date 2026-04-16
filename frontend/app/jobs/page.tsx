import 'server-only'
import { Suspense } from 'react'
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

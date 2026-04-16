import 'server-only'
import { Suspense } from 'react'
import { JobsClient } from '@/presentation/views/jobs'
import { JobsSkeleton } from '@/presentation/views/jobs/components/organisms/jobs-skeleton.component'
import { jobServerService } from '@/core/infrastructure/services/job-server.service'

export default async function JobsPage() {
  const response = await jobServerService.getAll()

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

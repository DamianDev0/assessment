import type { Job } from '@/core/domain/entities/job'
import type { CursorPage } from '@/core/shared/interfaces/api-response'
import type { SearchJobsRequest } from '@/core/domain/entities/job/request/search-jobs.request'
import type { JobServerRepository } from '@/core/domain/repositories/job.server-repository'

export class GetJobsUseCase {
  constructor(private readonly repository: JobServerRepository) {}

  execute(params?: SearchJobsRequest): Promise<CursorPage<Job>> {
    return this.repository.getAll(params)
  }
}

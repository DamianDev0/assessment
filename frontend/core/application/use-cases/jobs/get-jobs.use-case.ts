import type { Job } from '@/core/domain/entities/job'
import type { PagedResult } from '@/core/shared/interfaces/api-response'
import type { SearchJobsRequest } from '@/core/domain/entities/job/request/search-jobs.request'
import type { JobServerRepository } from '@/core/domain/repositories/job.server-repository'

export class GetJobsUseCase {
  constructor(private readonly repository: JobServerRepository) {}

  execute(params?: SearchJobsRequest): Promise<PagedResult<Job>> {
    return this.repository.list(params)
  }
}

import type { SearchJobsRequest, SearchJobsResponse } from '@/core/domain/entities/job'
import type { JobRepository } from '@/core/domain/repositories/job.repository'

export class SearchJobsUseCase {
  constructor(private readonly repository: JobRepository) {}

  execute(params: SearchJobsRequest): Promise<SearchJobsResponse> {
    return this.repository.search(params)
  }
}

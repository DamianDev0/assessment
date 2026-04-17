import type { Job } from '@/core/domain/entities/job'
import type { PagedResult } from '@/core/shared/interfaces/api-response'
import type { SearchJobsRequest } from '@/core/domain/entities/job/request/search-jobs.request'

export interface JobServerRepository {
  list(params?: SearchJobsRequest): Promise<PagedResult<Job>>
}

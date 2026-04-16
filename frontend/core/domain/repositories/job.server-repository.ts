import type { Job } from '@/core/domain/entities/job'
import type { CursorPage } from '@/core/shared/interfaces/api-response'
import type { SearchJobsRequest } from '@/core/domain/entities/job/request/search-jobs.request'

export interface JobServerRepository {
  getAll(params?: SearchJobsRequest): Promise<CursorPage<Job>>
}

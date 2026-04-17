import type { Job } from '../job.entity'
import type { PagedResult } from '@/core/shared/interfaces/api-response'

export type SearchJobsResponse = PagedResult<Job>

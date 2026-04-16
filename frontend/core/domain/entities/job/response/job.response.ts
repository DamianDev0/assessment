import type { Job } from '../job.entity'
import type { CursorPage } from '@/core/shared/interfaces/api-response'

export type SearchJobsResponse = CursorPage<Job>

import type { JobRepository } from '@/core/domain/repositories/job.repository'
import type { Job, CreateJobRequest, CompleteJobRequest, SearchJobsRequest, SearchJobsResponse } from '@/core/domain/entities/job'
import { jobService } from '../services/job.service'

export class JobRepositoryImpl implements JobRepository {
  search(params: SearchJobsRequest): Promise<SearchJobsResponse> {
    return jobService.search(params)
  }

  getById(id: string): Promise<Job> {
    return jobService.getById(id)
  }

  create(data: CreateJobRequest): Promise<string> {
    return jobService.create(data)
  }

  schedule(jobId: string, scheduledDate: string, assigneeId: string): Promise<void> {
    return jobService.schedule(jobId, scheduledDate, assigneeId)
  }

  start(jobId: string): Promise<void> {
    return jobService.start(jobId)
  }

  complete(jobId: string, data: CompleteJobRequest): Promise<void> {
    return jobService.complete(jobId, data)
  }

  cancel(jobId: string, reason: string): Promise<void> {
    return jobService.cancel(jobId, reason)
  }
}

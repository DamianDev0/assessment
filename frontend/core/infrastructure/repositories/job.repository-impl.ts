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

  complete(jobId: string, data: CompleteJobRequest): Promise<void> {
    return jobService.complete(jobId, data)
  }
}

export const jobRepository = new JobRepositoryImpl()

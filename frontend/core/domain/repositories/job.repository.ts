import type { Job, SearchJobsRequest, SearchJobsResponse, CreateJobRequest, CompleteJobRequest } from '../entities/job'

export interface JobRepository {
  search(params: SearchJobsRequest): Promise<SearchJobsResponse>
  getById(id: string): Promise<Job>
  create(data: CreateJobRequest): Promise<string>
  schedule(jobId: string, scheduledDate: string, assigneeId: string): Promise<void>
  start(jobId: string): Promise<void>
  complete(jobId: string, data: CompleteJobRequest): Promise<void>
  cancel(jobId: string, reason: string): Promise<void>
}

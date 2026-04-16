import type { Job, SearchJobsRequest, SearchJobsResponse, CreateJobRequest, CompleteJobRequest } from '../entities/job'

export interface JobRepository {
  search(params: SearchJobsRequest): Promise<SearchJobsResponse>
  getById(id: string): Promise<Job>
  create(data: CreateJobRequest): Promise<string>
  complete(jobId: string, data: CompleteJobRequest): Promise<void>
}

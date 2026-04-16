import { api } from '@/core/config/api'
import type { Job, SearchJobsRequest, SearchJobsResponse, CreateJobRequest, CompleteJobRequest } from '@/core/domain/entities/job'

export const jobService = {
  async search(params: SearchJobsRequest): Promise<SearchJobsResponse> {
    const { data } = await api.get<SearchJobsResponse>('/jobs', { params })
    return data
  },

  async getById(id: string): Promise<Job> {
    const { data } = await api.get<Job>(`/jobs/${id}`)
    return data
  },

  async create(request: CreateJobRequest): Promise<string> {
    const { data } = await api.post<string>('/jobs', request)
    return data
  },

  async schedule(jobId: string, scheduledDate: string, assigneeId: string): Promise<void> {
    await api.post(`/jobs/${jobId}/schedule`, { scheduledDate, assigneeId })
  },

  async start(jobId: string): Promise<void> {
    await api.post(`/jobs/${jobId}/start`)
  },

  async complete(jobId: string, request: CompleteJobRequest): Promise<void> {
    await api.post(`/jobs/${jobId}/complete`, request)
  },

  async cancel(jobId: string, reason: string): Promise<void> {
    await api.post(`/jobs/${jobId}/cancel`, { reason })
  },
}

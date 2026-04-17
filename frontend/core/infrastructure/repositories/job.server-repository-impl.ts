import 'server-only'
import type { Job } from '@/core/domain/entities/job'
import type { PagedResult } from '@/core/shared/interfaces/api-response'
import type { SearchJobsRequest } from '@/core/domain/entities/job/request/search-jobs.request'
import type { JobServerRepository } from '@/core/domain/repositories/job.server-repository'

export class JobServerRepositoryImpl implements JobServerRepository {
  constructor(
    private readonly apiUrl: string,
    private readonly organizationId: string,
  ) {}

  async list(params?: SearchJobsRequest): Promise<PagedResult<Job>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    if (params?.searchTerm) query.set('searchTerm', params.searchTerm)

    const queryString = query.size ? `?${query.toString()}` : ''
    const url = `${this.apiUrl}/api/jobs${queryString}`

    const res = await fetch(url, {
      headers: { 'X-Organization-Id': this.organizationId },
      next: { revalidate: 0 },
    })

    if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`)
    return res.json()
  }
}

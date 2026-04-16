import 'server-only'
import type { Job } from '@/core/domain/entities/job'
import type { CursorPage } from '@/core/shared/interfaces/api-response'

const API_URL = process.env.API_URL ?? 'http://localhost:5050'
const ORG_ID = process.env.DEFAULT_ORG_ID ?? '00000000-0000-0000-0000-000000000001'

export const jobServerService = {
  async getAll(): Promise<CursorPage<Job>> {
    const res = await fetch(`${API_URL}/api/jobs`, {
      headers: { 'X-Organization-Id': ORG_ID },
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error('Failed to fetch jobs')
    return res.json()
  },
}

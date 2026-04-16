import type { JobRepository } from '@/core/domain/repositories/job.repository'

export class CancelJobUseCase {
  constructor(private readonly repository: JobRepository) {}

  execute(jobId: string, reason: string): Promise<void> {
    return this.repository.cancel(jobId, reason)
  }
}

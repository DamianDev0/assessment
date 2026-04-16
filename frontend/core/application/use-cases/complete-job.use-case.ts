import type { CompleteJobRequest } from '@/core/domain/entities/job'
import type { JobRepository } from '@/core/domain/repositories/job.repository'

export class CompleteJobUseCase {
  constructor(private readonly repository: JobRepository) {}

  execute(jobId: string, data: CompleteJobRequest): Promise<void> {
    return this.repository.complete(jobId, data)
  }
}

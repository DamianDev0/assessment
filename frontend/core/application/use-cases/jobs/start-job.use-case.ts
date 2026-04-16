import type { JobRepository } from '@/core/domain/repositories/job.repository'

export class StartJobUseCase {
  constructor(private readonly repository: JobRepository) {}

  execute(jobId: string): Promise<void> {
    return this.repository.start(jobId)
  }
}

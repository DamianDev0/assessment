import type { Job } from '@/core/domain/entities/job'
import type { JobRepository } from '@/core/domain/repositories/job.repository'

export class GetJobByIdUseCase {
  constructor(private readonly repository: JobRepository) {}

  execute(id: string): Promise<Job> {
    return this.repository.getById(id)
  }
}

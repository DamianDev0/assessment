import type { CreateJobRequest } from '@/core/domain/entities/job'
import type { JobRepository } from '@/core/domain/repositories/job.repository'

export class CreateJobUseCase {
  constructor(private readonly repository: JobRepository) {}

  execute(data: CreateJobRequest): Promise<string> {
    return this.repository.create(data)
  }
}

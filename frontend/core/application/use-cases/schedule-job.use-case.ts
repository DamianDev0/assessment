import type { JobRepository } from '@/core/domain/repositories/job.repository'

export class ScheduleJobUseCase {
  constructor(private readonly repository: JobRepository) {}

  execute(jobId: string, scheduledDate: string, assigneeId: string): Promise<void> {
    return this.repository.schedule(jobId, scheduledDate, assigneeId)
  }
}

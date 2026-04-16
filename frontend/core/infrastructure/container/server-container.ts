import 'server-only'
import { JobServerRepositoryImpl } from '@/core/infrastructure/repositories/job.server-repository-impl'
import { GetJobsUseCase } from '@/core/application/use-cases/jobs'
import type { JobServerRepository } from '@/core/domain/repositories/job.server-repository'

const API_URL = process.env.API_URL ?? 'http://localhost:5050'
const ORG_ID = process.env.DEFAULT_ORG_ID ?? '00000000-0000-0000-0000-000000000001'

class ServerContainer {
  private _jobRepository?: JobServerRepository
  private _getJobsUseCase?: GetJobsUseCase

  get jobRepository(): JobServerRepository {
    this._jobRepository ??= new JobServerRepositoryImpl(API_URL, ORG_ID)
    return this._jobRepository
  }

  get getJobsUseCase(): GetJobsUseCase {
    this._getJobsUseCase ??= new GetJobsUseCase(this.jobRepository)
    return this._getJobsUseCase
  }
}

export const container = new ServerContainer()

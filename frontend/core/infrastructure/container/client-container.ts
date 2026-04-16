import type { JobRepository } from '@/core/domain/repositories/job.repository'
import { JobRepositoryImpl } from '@/core/infrastructure/repositories/job.repository-impl'
import {
  SearchJobsUseCase,
  GetJobByIdUseCase,
  CreateJobUseCase,
  CompleteJobUseCase,
  ScheduleJobUseCase,
  StartJobUseCase,
  CancelJobUseCase,
} from '@/core/application/use-cases/jobs'

class ClientContainer {
  private _jobRepository?: JobRepository
  private _searchJobs?: SearchJobsUseCase
  private _getJobById?: GetJobByIdUseCase
  private _createJob?: CreateJobUseCase
  private _completeJob?: CompleteJobUseCase
  private _scheduleJob?: ScheduleJobUseCase
  private _startJob?: StartJobUseCase
  private _cancelJob?: CancelJobUseCase

  get jobRepository(): JobRepository {
    this._jobRepository ??= new JobRepositoryImpl()
    return this._jobRepository
  }

  get searchJobs(): SearchJobsUseCase {
    this._searchJobs ??= new SearchJobsUseCase(this.jobRepository)
    return this._searchJobs
  }

  get getJobById(): GetJobByIdUseCase {
    this._getJobById ??= new GetJobByIdUseCase(this.jobRepository)
    return this._getJobById
  }

  get createJob(): CreateJobUseCase {
    this._createJob ??= new CreateJobUseCase(this.jobRepository)
    return this._createJob
  }

  get completeJob(): CompleteJobUseCase {
    this._completeJob ??= new CompleteJobUseCase(this.jobRepository)
    return this._completeJob
  }

  get scheduleJob(): ScheduleJobUseCase {
    this._scheduleJob ??= new ScheduleJobUseCase(this.jobRepository)
    return this._scheduleJob
  }

  get startJob(): StartJobUseCase {
    this._startJob ??= new StartJobUseCase(this.jobRepository)
    return this._startJob
  }

  get cancelJob(): CancelJobUseCase {
    this._cancelJob ??= new CancelJobUseCase(this.jobRepository)
    return this._cancelJob
  }
}

export const clientContainer = new ClientContainer()

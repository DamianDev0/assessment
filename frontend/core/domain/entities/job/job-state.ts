export type DraftJob = { status: 'draft'; notes?: string }
export type ScheduledJob = { status: 'scheduled'; scheduledDate: Date; assigneeId: string }
export type InProgressJob = { status: 'in_progress'; startedAt: Date; assigneeId: string; photos: string[] }
export type CompletedJob = { status: 'completed'; startedAt: Date; completedAt: Date; assigneeId: string; photos: string[]; signatureUrl: string }
export type CancelledJob = { status: 'cancelled'; cancelledAt: Date; reason: string }

export type JobState = DraftJob | ScheduledJob | InProgressJob | CompletedJob | CancelledJob

type TransitionMap = {
  draft: 'scheduled'
  scheduled: 'in_progress' | 'cancelled'
  in_progress: 'completed' | 'cancelled'
  completed: never
  cancelled: never
}

type JobActionMap = {
  scheduled: { type: 'schedule'; scheduledDate: Date; assigneeId: string }
  in_progress: { type: 'start' }
  completed: { type: 'complete'; signatureUrl: string }
  cancelled: { type: 'cancel'; reason: string }
}

export type ValidAction<S extends JobState['status']> = TransitionMap[S] extends never
  ? never
  : JobActionMap[TransitionMap[S]]

export type JobAction = JobActionMap[keyof JobActionMap]

export function transitionJob(current: DraftJob, action: ValidAction<'draft'>): ScheduledJob
export function transitionJob(current: ScheduledJob, action: ValidAction<'scheduled'>): InProgressJob | CancelledJob
export function transitionJob(current: InProgressJob, action: ValidAction<'in_progress'>): CompletedJob | CancelledJob
export function transitionJob(current: JobState, action: JobAction): JobState {
  switch (action.type) {
    case 'schedule':
      return {
        status: 'scheduled',
        scheduledDate: action.scheduledDate,
        assigneeId: action.assigneeId,
      }
    case 'start': {
      const scheduled = current as ScheduledJob
      return {
        status: 'in_progress',
        startedAt: new Date(),
        assigneeId: scheduled.assigneeId,
        photos: [],
      }
    }
    case 'complete': {
      const inProgress = current as InProgressJob
      return {
        status: 'completed',
        startedAt: inProgress.startedAt,
        completedAt: new Date(),
        assigneeId: inProgress.assigneeId,
        photos: inProgress.photos,
        signatureUrl: action.signatureUrl,
      }
    }
    case 'cancel':
      return {
        status: 'cancelled',
        cancelledAt: new Date(),
        reason: action.reason,
      }
  }
}

export function getJobSummary(state: JobState): string {
  switch (state.status) {
    case 'draft':
      return `Draft: ${state.notes ?? 'No notes'}`
    case 'scheduled':
      return `Scheduled for ${state.scheduledDate.toLocaleDateString()}`
    case 'in_progress':
      return `In progress since ${state.startedAt.toLocaleDateString()}`
    case 'completed':
      return `Completed at ${state.completedAt.toLocaleDateString()}`
    case 'cancelled':
      return `Cancelled: ${state.reason}`
    default: {
      const _exhaustive: never = state
      return _exhaustive
    }
  }
}

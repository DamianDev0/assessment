export enum JobStatus {
  DRAFT = 'Draft',
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

interface JobStatusConfig {
  label: string
  color: string
  chipColor: string
  terminal: boolean
}

const JOB_STATUS_CONFIG: Record<JobStatus, JobStatusConfig> = {
  [JobStatus.DRAFT]: {
    label: 'Draft',
    color: '#4b5563',
    chipColor: 'rgba(107,114,128,0.18)',
    terminal: false,
  },
  [JobStatus.SCHEDULED]: {
    label: 'Scheduled',
    color: '#4338ca',
    chipColor: 'rgba(99,102,241,0.18)',
    terminal: false,
  },
  [JobStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#047857',
    chipColor: 'rgba(16,185,129,0.18)',
    terminal: false,
  },
  [JobStatus.COMPLETED]: {
    label: 'Completed',
    color: '#065f46',
    chipColor: 'rgba(16,185,129,0.22)',
    terminal: true,
  },
  [JobStatus.CANCELLED]: {
    label: 'Cancelled',
    color: '#b91c1c',
    chipColor: 'rgba(239,68,68,0.18)',
    terminal: true,
  },
}

const buildRecord = <K extends keyof JobStatusConfig>(key: K) =>
  Object.fromEntries(
    Object.entries(JOB_STATUS_CONFIG).map(([status, config]) => [status, config[key]])
  ) as Record<JobStatus, JobStatusConfig[K]>

export const JobStatusLabels = buildRecord('label')
export const JobStatusColors = buildRecord('color')
export const JobStatusChipColors = buildRecord('chipColor')

export const JobStatusGroups = {
  active: [JobStatus.DRAFT, JobStatus.SCHEDULED, JobStatus.IN_PROGRESS],
  terminal: [JobStatus.COMPLETED, JobStatus.CANCELLED],
} as const

export const JOB_STATUS_OPTIONS = Object.values(JobStatus).map((status) => ({
  value: status,
  label: JobStatusLabels[status],
  disabled: false,
}))

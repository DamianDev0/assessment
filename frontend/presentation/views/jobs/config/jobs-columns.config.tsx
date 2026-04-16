import { StatusBadge } from "@/components/atoms/status-badge"
import { JobStatus } from "@/core/shared/enums/job-status.enum"
import type { Job } from "@/core/domain/entities/job"
import type { DataTableColumn, DataTableAction } from "@/components/types/data-table.types"

const ACTION_MAP: Record<string, DataTableAction[]> = {
  [JobStatus.DRAFT]: [
    { label: "Schedule", value: "schedule" },
    { label: "Cancel", value: "cancel" },
  ],
  [JobStatus.SCHEDULED]: [
    { label: "Start", value: "start" },
    { label: "Cancel", value: "cancel" },
  ],
  [JobStatus.IN_PROGRESS]: [
    { label: "Complete", value: "complete" },
    { label: "Cancel", value: "cancel" },
  ],
}

export function getJobActions(job: Job): DataTableAction[] {
  return ACTION_MAP[job.status] ?? []
}

export const getJobsColumns = (): DataTableColumn<Job>[] => [
  {
    key: "title",
    header: "Title",
    sortable: true,
    render: (job) => (
      <div>
        <span className="font-[510] text-foreground">{job.title}</span>
        <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
          {job.city}, {job.state}
        </span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    filterable: true,
    render: (job) => <StatusBadge status={job.status} />,
  },
  {
    key: "city",
    header: "Location",
    className: "hidden md:table-cell",
    render: (job) => <span className="text-muted-foreground">{job.city}, {job.state}</span>,
  },
  {
    key: "scheduledDate",
    header: "Scheduled",
    sortable: true,
    className: "hidden lg:table-cell",
    render: (job) => (
      <span className="text-muted-foreground">
        {job.scheduledDate ? new Date(job.scheduledDate).toISOString().slice(0, 10) : "—"}
      </span>
    ),
  },
]

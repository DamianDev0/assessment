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

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export const getJobsColumns = (): DataTableColumn<Job>[] => [
  {
    key: "title",
    header: "Title",
    sortable: true,
    render: (job) => <span className="font-[510] text-foreground">{job.title}</span>,
  },
  {
    key: "description",
    header: "Description",
    className: "hidden lg:table-cell max-w-[200px]",
    render: (job) => (
      <span className="text-muted-foreground truncate block" title={job.description}>
        {job.description || "—"}
      </span>
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
    render: (job) => (
      <span className="text-muted-foreground">{job.city}, {job.state}</span>
    ),
  },
  {
    key: "scheduledDate",
    header: "Scheduled",
    sortable: true,
    className: "hidden lg:table-cell",
    render: (job) => (
      <span className="text-muted-foreground">{formatDate(job.scheduledDate)}</span>
    ),
  },
  {
    key: "assigneeId",
    header: "Assignee",
    className: "hidden xl:table-cell",
    render: (job) => (
      <span className="text-muted-foreground text-xs font-mono">
        {job.assigneeId ? job.assigneeId.slice(0, 8) : "—"}
      </span>
    ),
  },
  {
    key: "photoCount",
    header: "Photos",
    className: "hidden xl:table-cell",
    render: (job) => (
      <span className="text-muted-foreground">{job.photoCount}</span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    className: "hidden lg:table-cell",
    render: (job) => (
      <span className="text-muted-foreground">{formatDate(job.createdAt)}</span>
    ),
  },
]

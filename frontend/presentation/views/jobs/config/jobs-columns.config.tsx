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
    sortKey: "title",
    className: "min-w-[160px]",
    render: (job) => <span className="font-[510] text-foreground">{job.title}</span>,
  },
  {
    key: "description",
    header: "Description",
    className: "hidden lg:table-cell min-w-[180px] max-w-[260px]",
    render: (job) => (
      <span className="text-muted-foreground truncate block" title={job.description}>
        {job.description || "—"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    className: "min-w-[110px]",
    render: (job) => <StatusBadge status={job.status} />,
  },
  {
    key: "city",
    header: "Location",
    className: "hidden md:table-cell min-w-[120px]",
    render: (job) => (
      <span className="text-muted-foreground whitespace-nowrap">{job.city}, {job.state}</span>
    ),
  },
  {
    key: "scheduledDate",
    header: "Scheduled",
    sortable: true,
    sortKey: "scheduled_date",
    className: "hidden lg:table-cell min-w-[110px]",
    render: (job) => (
      <span className="text-muted-foreground whitespace-nowrap">{formatDate(job.scheduledDate)}</span>
    ),
  },
  {
    key: "assigneeId",
    header: "Assignee",
    className: "hidden xl:table-cell min-w-[90px]",
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
    sortKey: "created_at",
    className: "hidden lg:table-cell min-w-[100px]",
    render: (job) => (
      <span className="text-muted-foreground whitespace-nowrap">{formatDate(job.createdAt)}</span>
    ),
  },
]

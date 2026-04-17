"use client"

import { JobStatusLabels, JobStatusColors, JobStatusChipColors } from "@/core/shared/enums/job-status.enum"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: Readonly<StatusBadgeProps>) {
  const label = JobStatusLabels[status as keyof typeof JobStatusLabels] ?? status
  const color = JobStatusColors[status as keyof typeof JobStatusColors] ?? "#8a8f98"
  const bg = JobStatusChipColors[status as keyof typeof JobStatusChipColors] ?? "rgba(255,255,255,0.05)"

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color }}
      data-testid="job-status"
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

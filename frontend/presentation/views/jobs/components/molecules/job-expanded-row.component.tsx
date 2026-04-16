'use client'

import { MapPin, Calendar, User, Camera, Clock, FileText } from 'lucide-react'
import { StatusBadge } from '@/components/atoms/status-badge'
import type { Job } from '@/core/domain/entities/job'

interface JobExpandedRowProps {
  readonly job: Job
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Detail({ icon: Icon, label, value }: Readonly<{ icon: typeof MapPin; label: string; value: string }>) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
      <div>
        <span className="text-muted-foreground">{label}</span>
        <p className="text-foreground font-[450]">{value}</p>
      </div>
    </div>
  )
}

export function JobExpandedRow({ job }: Readonly<JobExpandedRowProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Detail icon={FileText} label="Description" value={job.description || 'No description'} />
      <Detail icon={MapPin} label="Address" value={`${job.street}, ${job.city}, ${job.state} ${job.zipCode}`} />
      <Detail icon={Calendar} label="Scheduled" value={formatDate(job.scheduledDate)} />
      <Detail icon={User} label="Assignee" value={job.assigneeId ?? 'Unassigned'} />
      <Detail icon={Camera} label="Photos" value={`${job.photoCount} photo${job.photoCount !== 1 ? 's' : ''}`} />
      <Detail icon={Clock} label="Created" value={formatDate(job.createdAt)} />

      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Status</span>
        <StatusBadge status={job.status} />
        <span className="text-xs text-muted-foreground ml-auto">Last updated: {formatDate(job.updatedAt)}</span>
      </div>
    </div>
  )
}

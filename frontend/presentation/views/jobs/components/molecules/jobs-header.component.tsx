'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { ThemeToggle } from '@/components/atoms/theme-toggle'

interface JobsHeaderProps {
  onCreateJob: () => void
}

export function JobsHeader({ onCreateJob }: Readonly<JobsHeaderProps>) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-[510] tracking-tight text-foreground">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage and track roofing jobs</p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onCreateJob} size="sm" data-testid="create-job-button">
          <Plus className="h-4 w-4" />
          New Job
        </Button>
        <ThemeToggle />
      </div>
    </div>
  )
}

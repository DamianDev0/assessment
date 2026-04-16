'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn/dialog'
import { Button } from '@/components/shadcn/button'
import { Calendar } from '@/components/shadcn/calendar'

interface ScheduleJobModalProps {
  readonly isOpen: boolean
  readonly jobId: string | null
  readonly onClose: () => void
  readonly onSubmit: (date: Date, assigneeId: string) => void
  readonly isLoading: boolean
  readonly error: string | null
}

export function ScheduleJobModal({ isOpen, jobId, onClose, onSubmit, isLoading, error }: Readonly<ScheduleJobModalProps>) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  if (!jobId) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleSchedule = () => {
    if (!selectedDate) return
    onSubmit(selectedDate, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent data-testid="schedule-job-modal" className="sm:max-w-sm p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Schedule Job</DialogTitle>
            <DialogDescription>Select a date for this job.</DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="mt-3 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex justify-center border-t border-border bg-card/50 py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date <= today}
          />
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : 'No date selected'}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={isLoading || !selectedDate} onClick={handleSchedule}>
              {isLoading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

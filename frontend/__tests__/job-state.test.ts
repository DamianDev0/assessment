import { describe, it, expect } from 'vitest'
import { transitionJob, getJobSummary } from '@/core/domain/entities/job/job-state'
import type { DraftJob, ScheduledJob, InProgressJob, CompletedJob, CancelledJob } from '@/core/domain/entities/job'

describe('transitionJob', () => {
  const draft: DraftJob = { status: 'draft', notes: 'New job' }
  const scheduled: ScheduledJob = { status: 'scheduled', scheduledDate: new Date('2026-12-01'), assigneeId: 'a1' }
  const inProgress: InProgressJob = { status: 'in_progress', startedAt: new Date(), assigneeId: 'a1', photos: [] }

  it('transitions Draft to Scheduled', () => {
    const result = transitionJob(draft, { type: 'schedule', scheduledDate: new Date('2026-12-01'), assigneeId: 'a1' })
    expect(result.status).toBe('scheduled')
  })

  it('transitions Scheduled to InProgress', () => {
    const result = transitionJob(scheduled, { type: 'start' })
    expect(result.status).toBe('in_progress')
  })

  it('transitions Scheduled to Cancelled', () => {
    const result = transitionJob(scheduled, { type: 'cancel', reason: 'Weather' })
    expect(result.status).toBe('cancelled')
  })

  it('transitions InProgress to Completed', () => {
    const result = transitionJob(inProgress, { type: 'complete', signatureUrl: 'https://sig.png' })
    expect(result.status).toBe('completed')
  })

  it('transitions InProgress to Cancelled', () => {
    const result = transitionJob(inProgress, { type: 'cancel', reason: 'Customer request' })
    expect(result.status).toBe('cancelled')
  })

  it('preserves assigneeId when starting', () => {
    const result = transitionJob(scheduled, { type: 'start' })
    expect((result as InProgressJob).assigneeId).toBe('a1')
  })

  it('preserves photos and startedAt when completing', () => {
    const result = transitionJob(inProgress, { type: 'complete', signatureUrl: 'https://sig.png' })
    const completed = result as CompletedJob
    expect(completed.startedAt).toBe(inProgress.startedAt)
    expect(completed.signatureUrl).toBe('https://sig.png')
  })
})

describe('getJobSummary', () => {
  it('returns summary for draft', () => {
    expect(getJobSummary({ status: 'draft', notes: 'Test' })).toBe('Draft: Test')
  })

  it('returns summary for draft without notes', () => {
    expect(getJobSummary({ status: 'draft' })).toBe('Draft: No notes')
  })

  it('returns summary for scheduled', () => {
    const date = new Date('2026-12-01')
    expect(getJobSummary({ status: 'scheduled', scheduledDate: date, assigneeId: 'a1' }))
      .toContain('Scheduled for')
  })

  it('returns summary for cancelled', () => {
    expect(getJobSummary({ status: 'cancelled', cancelledAt: new Date(), reason: 'Weather' }))
      .toBe('Cancelled: Weather')
  })
})

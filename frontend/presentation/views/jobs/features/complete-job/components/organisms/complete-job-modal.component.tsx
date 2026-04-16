'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn/dialog'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { extractFormValues } from '@/core/shared/utils/form'

interface CompleteJobModalProps {
  readonly isOpen: boolean
  readonly jobId: string | null
  readonly onClose: () => void
  readonly onSubmit: (signatureUrl: string) => void
  readonly isLoading: boolean
  readonly error: string | null
}

const FORM_KEYS = ['signatureUrl'] as const

export function CompleteJobModal({ isOpen, jobId, onClose, onSubmit, isLoading, error }: Readonly<CompleteJobModalProps>) {
  if (!jobId) return null

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const values = extractFormValues(e.currentTarget, FORM_KEYS)
    onSubmit(values.signatureUrl)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent data-testid="complete-job-modal">
        <DialogHeader>
          <DialogTitle>Complete Job</DialogTitle>
          <DialogDescription>Provide the customer signature to mark this job as completed.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="signatureUrl" className="block text-sm font-[510] text-foreground mb-1">Signature URL</label>
            <Input
              id="signatureUrl"
              name="signatureUrl"
              type="url"
              required
              placeholder="https://..."
              data-testid="signature-url-input"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} data-testid="complete-job-submit">
              {isLoading ? 'Completing...' : 'Mark Complete'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

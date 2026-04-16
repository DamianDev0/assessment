'use client'

import { useEffect } from 'react'
import { Button } from '@/components/shadcn/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function JobsError({ error, reset }: Readonly<ErrorProps>) {
  useEffect(() => {
    console.error('[JobsPage error]', error)
  }, [error])

  return (
    <div className="mx-auto max-w-6xl px-6 py-10" data-testid="jobs-error">
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-[510] text-foreground mb-2">Failed to load jobs</h2>
        <p className="text-sm text-muted-foreground mb-6">{error.message}</p>
        <Button onClick={reset} data-testid="retry-button">Try again</Button>
      </div>
    </div>
  )
}

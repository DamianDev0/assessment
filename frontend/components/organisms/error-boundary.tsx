'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/shadcn/button'

interface ErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallback?: (error: Error, reset: () => void) => ReactNode
  readonly onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  readonly error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    const { children, fallback } = this.props

    return error ? (
      fallback ? fallback(error, this.reset) : <DefaultErrorFallback error={error} reset={this.reset} />
    ) : (
      children
    )
  }
}

interface DefaultErrorFallbackProps {
  readonly error: Error
  readonly reset: () => void
}

function DefaultErrorFallback({ error, reset }: Readonly<DefaultErrorFallbackProps>) {
  return (
    <div
      role="alert"
      data-testid="error-boundary-fallback"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center"
    >
      <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
      <h2 className="mt-3 text-base font-[510] text-foreground">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset} size="sm" variant="outline" className="mt-4">
        Try again
      </Button>
    </div>
  )
}

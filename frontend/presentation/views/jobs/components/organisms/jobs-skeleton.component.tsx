const SKELETON_ROWS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'] as const

export function JobsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-4" data-testid="jobs-skeleton">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card">
        <div className="h-9 w-40 bg-muted rounded animate-pulse" />
        <div className="h-9 w-36 bg-muted rounded animate-pulse" />
        <div className="h-9 w-36 bg-muted rounded animate-pulse" />
        <div className="h-9 w-50 bg-muted rounded animate-pulse" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse hidden md:block" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse hidden lg:block" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
        </div>
        {SKELETON_ROWS.map((id) => (
          <div key={id} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse hidden md:block" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse hidden lg:block" />
            <div className="h-6 w-6 bg-muted rounded animate-pulse ml-auto" />
          </div>
        ))}
      </div>

      <div className="h-4 w-16 bg-muted rounded animate-pulse" />
    </div>
  )
}

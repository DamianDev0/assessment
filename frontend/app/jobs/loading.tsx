const SKELETON_ROWS = ['ld-1', 'ld-2', 'ld-3', 'ld-4', 'ld-5', 'ld-6'] as const

export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10" data-testid="jobs-loading">
      <div className="h-7 w-24 bg-muted rounded animate-pulse mb-2" />
      <div className="h-4 w-48 bg-muted rounded animate-pulse mb-8" />
      <div className="space-y-2">
        {SKELETON_ROWS.map((id) => (
          <div key={id} className="h-14 bg-card rounded-lg border border-border animate-pulse" />
        ))}
      </div>
    </div>
  )
}

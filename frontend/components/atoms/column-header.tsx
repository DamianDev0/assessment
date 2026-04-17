"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

function SortIcon({ direction }: Readonly<{ direction?: "asc" | "desc" | null }>) {
  if (direction === "asc") return <ArrowUp className="h-3.5 w-3.5" />
  if (direction === "desc") return <ArrowDown className="h-3.5 w-3.5" />
  return <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
}

interface ColumnHeaderProps {
  readonly title: string
  readonly sortable?: boolean
  readonly sortDirection?: "asc" | "desc" | null
  readonly onSort?: () => void
}

export function ColumnHeader({ title, sortable = false, sortDirection, onSort }: Readonly<ColumnHeaderProps>) {
  if (!sortable) return <span className="text-sm font-medium text-muted-foreground">{title}</span>

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
        sortDirection ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onSort}
    >
      {title}
      <SortIcon direction={sortDirection} />
    </button>
  )
}

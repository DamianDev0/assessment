"use client"

import { useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { Input } from "@/components/shadcn/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover"
import { cn } from "@/lib/utils"

function SortIcon({ direction }: Readonly<{ direction?: "asc" | "desc" | null }>) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />
  return <ArrowUpDown className="h-3 w-3 opacity-50" />
}

interface ColumnHeaderProps {
  title: string
  sortable?: boolean
  filterable?: boolean
  sortDirection?: "asc" | "desc" | null
  filterValue?: string
  onSort?: () => void
  onFilter?: (value: string) => void
  onClearFilter?: () => void
}

export function ColumnHeader({
  title,
  sortable = false,
  filterable = false,
  sortDirection,
  filterValue = "",
  onSort,
  onFilter,
  onClearFilter,
}: Readonly<ColumnHeaderProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilter, setLocalFilter] = useState("")

  if (!sortable && !filterable) {
    return <span>{title}</span>
  }

  const handleApplyFilter = () => {
    onFilter?.(localFilter)
    setIsOpen(false)
  }

  const handleClearFilter = () => {
    setLocalFilter("")
    onClearFilter?.()
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 -ml-2 font-medium hover:bg-muted/50",
            filterValue && "text-primary"
          )}
        >
          {title}
          {sortable ? <SortIcon direction={sortDirection} /> : null}
          {filterValue ? <div className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="space-y-2">
          {filterable ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={`Filter ${title.toLowerCase()}...`}
                  value={localFilter}
                  onChange={(e) => setLocalFilter(e.target.value)}
                  className="h-8 pl-8 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleApplyFilter() }}
                />
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={handleApplyFilter}>
                  Apply
                </Button>
                {filterValue ? (
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleClearFilter}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {sortable ? (
            <div className={cn(filterable && "border-t pt-2")}>
              <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => { onSort?.(); setIsOpen(false) }}>
                <ArrowUp className="h-3.5 w-3.5 mr-2" />Ascending
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => { onSort?.(); setIsOpen(false) }}>
                <ArrowDown className="h-3.5 w-3.5 mr-2" />Descending
              </Button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

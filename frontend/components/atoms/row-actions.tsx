"use client"

import { MoreVertical } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/shadcn/dropdown-menu"
import type { DataTableAction } from "@/components/types/data-table.types"

interface RowActionsProps<T> {
  readonly item: T
  readonly actions: DataTableAction[]
  readonly onAction: (action: string, item: T) => void
}

export function RowActions<T>({ item, actions, onAction }: Readonly<RowActionsProps<T>>) {
  if (actions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions" title="Actions" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem key={action.value} onClick={(e) => { e.stopPropagation(); onAction(action.value, item) }}>
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import type { ReactNode } from "react"
import { TableCell, TableRow } from "@/components/shadcn/table"

interface ExpandedRowProps {
  isExpanded: boolean
  colSpan: number
  children: ReactNode
}

export function ExpandedRow({ isExpanded, colSpan, children }: Readonly<ExpandedRowProps>) {
  return isExpanded ? (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={colSpan} className="p-0">
        <div className="grid grid-rows-[1fr] animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
          <div className="p-4 min-h-0">{children}</div>
        </div>
      </TableCell>
    </TableRow>
  ) : null
}

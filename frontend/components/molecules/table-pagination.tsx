"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select"
import type { DataTablePagination } from "@/components/types/data-table.types"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface TablePaginationProps {
  pagination: DataTablePagination
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "ellipsis")[] = [1]

  if (current > 3) pages.push("ellipsis")

  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    if (!pages.includes(i)) pages.push(i)
  }

  if (current < total - 2) pages.push("ellipsis")
  if (!pages.includes(total)) pages.push(total)

  return pages
}

export function TablePagination({ pagination }: Readonly<TablePaginationProps>) {
  const startItem = (pagination.currentPage - 1) * pagination.itemsPerPage + 1
  const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {pagination.totalItems}
        </p>

        {pagination.onItemsPerPageChange ? (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Show:</span>
            <Select
              value={pagination.itemsPerPage.toString()}
              onValueChange={(value) => pagination.onItemsPerPageChange?.(Number(value))}
            >
              <SelectTrigger className="h-8 w-17.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getVisiblePages(pagination.currentPage, pagination.totalPages).map((page, pos) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${pos}`} className="px-2 text-muted-foreground">...</span>
          ) : (
            <Button
              key={`page-${page}`}
              variant={pagination.currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => pagination.onPageChange(page)}
              className="h-8 min-w-8"
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="h-8 px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

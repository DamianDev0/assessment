"use client"

import { Fragment } from "react"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table"
import { cn } from "@/lib/utils"
import { ColumnHeader } from "@/components/atoms/column-header"
import { RowActions } from "@/components/atoms/row-actions"
import { TablePagination } from "@/components/molecules/table-pagination"
import type { DataTableAction, DataTableProps } from "@/components/types/data-table.types"

const EMPTY_ACTIONS: DataTableAction[] = []

function renderCellValue(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  onRowAction,
  actions = EMPTY_ACTIONS,
  emptyMessage = "No data available",
  isLoading = false,
  onSort,
  sortField,
  sortDirection,
  rowClassName,
  pagination,
}: Readonly<DataTableProps<T>>) {
  const resolveActions = (item: T) =>
    typeof actions === "function" ? actions(item) : actions

  const hasActionsColumn = onRowAction && (typeof actions === "function" || actions.length > 0)
  const totalColumns = columns.length + (hasActionsColumn ? 1 : 0)
  const hasData = data.length > 0

  return (
    <div className="w-full">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead key={column.key} className={cn("py-3 px-4", column.className)}>
                    <ColumnHeader
                      title={column.header}
                      sortable={column.sortable}
                      sortDirection={sortField === (column.sortKey ?? column.key) ? sortDirection : null}
                      onSort={() => onSort?.(column.sortKey ?? column.key)}
                    />
                  </TableHead>
                ))}
                {hasActionsColumn ? <TableHead className="text-right py-3 px-4 w-20">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading && !hasData ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={totalColumns} className="h-80 text-center align-middle border-b-0">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && !hasData ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={totalColumns} className="h-80 text-center align-middle border-b-0">
                    <span className="text-muted-foreground">{emptyMessage}</span>
                  </TableCell>
                </TableRow>
              ) : null}

              {hasData ? (
                data.map((item, index) => {
                  const rowId = item.id ?? index
                  return (
                    <Fragment key={rowId}>
                      <TableRow className={cn(
                        "border-border hover:bg-muted/40 transition-colors",
                        isLoading && "opacity-40 pointer-events-none",
                        rowClassName?.(item),
                      )}>
                        {columns.map((column) => (
                          <TableCell key={column.key} className={cn("py-3 px-4", column.className)}>
                            {column.render
                              ? column.render(item)
                              : renderCellValue((item as Record<string, unknown>)[column.key])}
                          </TableCell>
                        ))}

                        {hasActionsColumn ? (
                          <TableCell className="text-right py-3 px-4">
                            <RowActions item={item} actions={resolveActions(item)} onAction={onRowAction} />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    </Fragment>
                  )
                })
              ) : null}
            </TableBody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 0 ? (
        <TablePagination pagination={pagination} />
      ) : (
        <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground">
          <span>{data.length} {data.length === 1 ? 'result' : 'results'}</span>
        </div>
      )}
    </div>
  )
}

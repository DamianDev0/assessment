"use client"

import { Fragment } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table"
import { Button } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"
import { TableSearch } from "@/components/atoms/table-search"
import { ColumnHeader } from "@/components/atoms/column-header"
import { RowActions } from "@/components/atoms/row-actions"
import { TablePagination } from "@/components/molecules/table-pagination"
import { ExpandedRow } from "@/components/molecules/expanded-row"
import { useTableSort } from "./use-table-sort"
import { useTableFilter } from "./use-table-filter"
import { useExpandableRows } from "./use-expandable-rows"
import type { DataTableProps } from "@/components/types/data-table.types"

function renderCellValue(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  onRowAction,
  onRowClick,
  actions = [],
  pagination,
  emptyMessage = "No data available",
  isLoading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  expandable = false,
  renderExpandedRow,
  rowClassName,
}: Readonly<DataTableProps<T>>) {
  const { handleSort, getSortDirection } = useTableSort()
  const { getFilterValue, setFilter, clearFilter } = useTableFilter()
  const { toggleRow, isExpanded } = useExpandableRows()

  const resolveActions = (item: T) =>
    typeof actions === "function" ? actions(item) : actions

  const hasActionsColumn = onRowAction && (typeof actions === "function" || actions.length > 0)
  const totalColumns = columns.length + (hasActionsColumn ? 1 : 0) + (expandable ? 1 : 0)

  return (
    <div className="w-full space-y-4">
      {searchable && onSearch ? (
        <div className="flex items-center justify-end">
          <TableSearch onChange={onSearch} placeholder={searchPlaceholder} />
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {expandable ? <TableHead className="w-12 py-3 px-2" /> : null}
                {columns.map((column) => (
                  <TableHead key={column.key} className={cn("py-3 px-4", column.className)}>
                    <ColumnHeader
                      title={column.header}
                      sortable={column.sortable}
                      filterable={column.filterable}
                      sortDirection={getSortDirection(column.key)}
                      filterValue={getFilterValue(column.key)}
                      onSort={() => handleSort(column.key)}
                      onFilter={(value) => setFilter(column.key, value)}
                      onClearFilter={() => clearFilter(column.key)}
                    />
                  </TableHead>
                ))}
                {hasActionsColumn ? <TableHead className="text-right py-3 px-4 w-20">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={totalColumns} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalColumns} className="h-24 text-center">
                    <span className="text-muted-foreground">{emptyMessage}</span>
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && data.length > 0 ? (
                data.map((item, index) => {
                  const rowId = item.id ?? index
                  return (
                    <Fragment key={rowId}>
                      <TableRow
                        className={cn("border-border", onRowClick && "cursor-pointer hover:bg-muted/50", rowClassName?.(item))}
                        onDoubleClick={() => onRowClick?.(item)}
                      >
                        {expandable ? (
                          <TableCell className="py-3 px-2">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toggleRow(rowId) }}>
                              {isExpanded(rowId) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        ) : null}

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

                      {expandable && renderExpandedRow ? (
                        <ExpandedRow isExpanded={isExpanded(rowId)} colSpan={totalColumns}>
                          {renderExpandedRow(item)}
                        </ExpandedRow>
                      ) : null}
                    </Fragment>
                  )
                })
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination ? <TablePagination pagination={pagination} /> : null}

      <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground">
        <span>{data.length} {data.length === 1 ? 'result' : 'results'}</span>
      </div>
    </div>
  )
}

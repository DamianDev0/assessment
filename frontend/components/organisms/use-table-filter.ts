import { useState, useCallback } from "react"

interface ColumnFilter {
  key: string
  value: string
}

export function useTableFilter() {
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([])

  const setFilter = useCallback((key: string, value: string) => {
    setColumnFilters((current) => {
      const filtered = current.filter((f) => f.key !== key)
      return value ? [...filtered, { key, value }] : filtered
    })
  }, [])

  const getFilterValue = useCallback(
    (key: string) => columnFilters.find((f) => f.key === key)?.value ?? "",
    [columnFilters]
  )

  const clearFilter = useCallback((key: string) => {
    setColumnFilters((current) => current.filter((f) => f.key !== key))
  }, [])

  return { columnFilters, setFilter, getFilterValue, clearFilter }
}

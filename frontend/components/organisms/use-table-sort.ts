import { useState, useCallback } from "react"

interface SortState {
  key: string
  direction: "asc" | "desc"
}

export function useTableSort() {
  const [sortConfig, setSortConfig] = useState<SortState | null>(null)

  const handleSort = useCallback((key: string) => {
    setSortConfig((current) => {
      if (current?.key !== key) return { key, direction: "asc" }
      if (current.direction === "asc") return { key, direction: "desc" }
      return null
    })
  }, [])

  const getSortDirection = useCallback(
    (key: string): "asc" | "desc" | null =>
      sortConfig?.key === key ? sortConfig.direction : null,
    [sortConfig]
  )

  return { sortConfig, handleSort, getSortDirection }
}

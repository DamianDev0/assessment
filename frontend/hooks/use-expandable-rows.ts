import { useState, useCallback } from "react"

export function useExpandableRows() {
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null)

  const toggleRow = useCallback((id: string | number) => {
    setExpandedRowId((current) => (current === id ? null : id))
  }, [])

  const isExpanded = useCallback(
    (id: string | number) => expandedRowId === id,
    [expandedRowId]
  )

  return { toggleRow, isExpanded }
}

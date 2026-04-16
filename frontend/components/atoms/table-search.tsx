"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/shadcn/input"

interface TableSearchProps {
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export function TableSearch({
  onChange,
  placeholder = "Search...",
  debounceMs = 400,
}: Readonly<TableSearchProps>) {
  const [localValue, setLocalValue] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), debounceMs)
    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onChange])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9 w-full sm:w-62.5 h-9"
      />
    </div>
  )
}

'use client'

import { createContext, useContext, useMemo, useState, useRef } from 'react'
import { X, Search } from 'lucide-react'
import { Input } from '@/components/shadcn/input'
import { Button } from '@/components/shadcn/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select'
import { DatePicker } from '@/components/molecules/date-picker'
import { cn } from '@/lib/utils'
import { JOB_STATUS_OPTIONS, type JobStatus } from '@/core/shared/enums/job-status.enum'
import type { JobFilters } from '@/core/domain/entities/job'

interface FilterBarContextValue {
  readonly onFilterChange: (filters: Partial<JobFilters>) => void
}

const FilterBarContext = createContext<FilterBarContextValue | null>(null)

function useFilterBarContext(): FilterBarContextValue {
  const ctx = useContext(FilterBarContext)
  if (!ctx) throw new Error('FilterBar subcomponents must be used inside <FilterBar>')
  return ctx
}

interface StatusProps {
  readonly value: JobStatus | null
}

function FilterBarStatus({ value }: Readonly<StatusProps>) {
  const { onFilterChange } = useFilterBarContext()

  return (
    <Select value={value ?? 'all'} onValueChange={(v) => onFilterChange({ status: v === 'all' ? null : (v as JobStatus) })}>
      <SelectTrigger className="w-full sm:w-40" data-testid="status-filter" aria-label="Filter by status">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {JOB_STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface DateRangeProps {
  readonly dateFrom: Date | null
  readonly dateTo: Date | null
}

function FilterBarDateRange({ dateFrom, dateTo }: Readonly<DateRangeProps>) {
  const { onFilterChange } = useFilterBarContext()

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <DatePicker
        value={dateFrom}
        onChange={(date) => onFilterChange({ dateFrom: date })}
        placeholder="From"
        aria-label="From date"
        data-testid="date-from-filter"
      />
      <span className="hidden sm:inline text-muted-foreground text-xs">to</span>
      <DatePicker
        value={dateTo}
        onChange={(date) => onFilterChange({ dateTo: date })}
        placeholder="To"
        aria-label="To date"
        data-testid="date-to-filter"
      />
    </div>
  )
}

interface SearchProps {
  readonly value: string | null
}

const SEARCH_DEBOUNCE_MS = 400

function FilterBarSearch({ value }: Readonly<SearchProps>) {
  const { onFilterChange } = useFilterBarContext()
  const [localValue, setLocalValue] = useState(value ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const prevValueRef = useRef(value)

  if (value !== prevValueRef.current) {
    prevValueRef.current = value
    const incoming = value ?? ''
    if (incoming !== localValue) {
      setLocalValue(incoming)
    }
  }

  const handleChange = (text: string) => {
    setLocalValue(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onFilterChange({ searchTerm: text || null }), SEARCH_DEBOUNCE_MS)
  }

  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
      <Input
        type="search"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search jobs..."
        className="pl-9"
        data-testid="search-filter"
        aria-label="Search jobs"
      />
    </div>
  )
}

interface FilterBarProps {
  readonly children: React.ReactNode
  readonly onFilterChange: (filters: Partial<JobFilters>) => void
  readonly onReset?: () => void
  readonly hasActiveFilters?: boolean
}

interface FilterBarComposition {
  Status: typeof FilterBarStatus
  DateRange: typeof FilterBarDateRange
  Search: typeof FilterBarSearch
}

function FilterBarRoot({ children, onFilterChange, onReset, hasActiveFilters }: Readonly<FilterBarProps>) {
  const contextValue = useMemo(() => ({ onFilterChange }), [onFilterChange])

  return (
    <FilterBarContext.Provider value={contextValue}>
      <div
        className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card"
        data-testid="filter-bar"
        role="search"
        aria-label="Job filters"
      >
        {children}
        {onReset ? (
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-xs text-muted-foreground transition-opacity", hasActiveFilters ? "opacity-100" : "opacity-0 pointer-events-none")}
            onClick={onReset}
            data-testid="clear-filters"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        ) : null}
      </div>
    </FilterBarContext.Provider>
  )
}

export const FilterBar = FilterBarRoot as typeof FilterBarRoot & FilterBarComposition
FilterBar.Status = FilterBarStatus
FilterBar.DateRange = FilterBarDateRange
FilterBar.Search = FilterBarSearch

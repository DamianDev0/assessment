"use client"

import { useRef, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Input } from "@/components/shadcn/input"
import { cn } from "@/lib/utils"
import type { AddressSuggestion } from "@/core/domain/entities/address"

interface AddressAutocompleteProps {
  readonly query: string
  readonly suggestions: readonly AddressSuggestion[]
  readonly isOpen: boolean
  readonly onSearch: (text: string) => void
  readonly onSelect: (suggestion: AddressSuggestion) => void
  readonly onClose: () => void
  readonly placeholder?: string
  readonly className?: string
}

export function AddressAutocomplete({
  query,
  suggestions,
  isOpen,
  onSearch,
  onSelect,
  onClose,
  placeholder = "Start typing an address...",
  className,
}: Readonly<AddressAutocompleteProps>) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) onClose() }}
        placeholder={placeholder}
        data-testid="address-input"
      />

      {isOpen && suggestions.length > 0 ? (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover">
          {suggestions.map((s) => (
            <li key={`${s.lat}-${s.lon}`}>
              <button
                type="button"
                onClick={() => onSelect(s)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent/10"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2 text-foreground">{s.formatted}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

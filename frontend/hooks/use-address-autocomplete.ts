"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { geocodeService } from "@/core/infrastructure/services/geocode.service"
import type { AddressSuggestion } from "@/core/domain/entities/address"

export function useAddressAutocomplete() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof globalThis.setTimeout>>(null)

  const search = useCallback((text: string) => {
    setQuery(text)

    if (debounceRef.current) globalThis.clearTimeout(debounceRef.current)
    debounceRef.current = globalThis.setTimeout(async () => {
      const results = await geocodeService.autocomplete(text)
      setSuggestions(results)
      setIsOpen(results.length > 0)
    }, 300)
  }, [])

  const select = useCallback((suggestion: AddressSuggestion) => {
    setQuery(suggestion.addressLine1)
    setSuggestions([])
    setIsOpen(false)
    return suggestion
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) globalThis.clearTimeout(debounceRef.current)
    }
  }, [])

  return { query, suggestions, isOpen, search, select, close }
}

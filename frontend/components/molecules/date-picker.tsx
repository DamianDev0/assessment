"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover"
import { Calendar } from "@/components/shadcn/calendar"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  readonly value: Date | null
  readonly onChange: (date: Date | null) => void
  readonly placeholder?: string
  readonly "aria-label"?: string
  readonly "data-testid"?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  ...props
}: Readonly<DatePickerProps>) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full sm:w-36 justify-start text-left font-normal", !value && "text-muted-foreground")}
          aria-label={props["aria-label"]}
          data-testid={props["data-testid"]}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "MMM dd, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="relative w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(day) => { onChange(day ?? null); setOpen(false) }}
        />
      </PopoverContent>
    </Popover>
  )
}

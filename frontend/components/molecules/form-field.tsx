"use client"

import { Input } from "@/components/shadcn/input"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  readonly id: string
  readonly label: string
  readonly error?: string
  readonly readOnly?: boolean
  readonly value?: string
  readonly placeholder?: string
  readonly className?: string
  readonly "data-testid"?: string
}

export function FormField({
  id,
  label,
  error,
  readOnly = false,
  value,
  placeholder,
  className,
  ...props
}: Readonly<FormFieldProps>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-[510] text-foreground mb-1">{label}</label>
      <Input
        id={id}
        name={id}
        readOnly={readOnly}
        defaultValue={value}
        placeholder={placeholder}
        className={cn(readOnly && "bg-muted/50", error && "border-destructive")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        data-testid={props["data-testid"]}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  )
}

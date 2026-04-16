"use client"

import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/shadcn/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

function Calendar({ className, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("relative p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center items-center h-8",
        caption_label: "text-sm font-[510] text-foreground",
        nav: "absolute top-3 left-3 right-3 z-10 flex justify-between",
        button_previous: cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 opacity-60 hover:opacity-100"),
        button_next: cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 opacity-60 hover:opacity-100"),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground w-10 font-normal text-xs text-center",
        week: "flex w-full mt-1",
        day: cn(buttonVariants({ variant: "ghost" }), "relative h-10 w-10 p-0 text-center text-sm font-normal"),
        day_button: "h-10 w-10",
        selected: "bg-primary text-primary-foreground hover:bg-primary rounded-md",
        today: "bg-accent/20 text-accent-foreground rounded-md",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 pointer-events-none",
        hidden: "invisible",
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left"
            ? <ChevronLeft className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-y-0",
        month: "space-y-4 ml-0 pl-0 sm:ml-0",
        month_caption: "flex justify-center relative items-center h-9 mb-4",
        caption_label: "text-sm font-medium",
        dropdowns: "flex items-center gap-1",
        button_previous: cn(
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-3 top-3.5 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 z-10"
        ),
        button_next: cn(
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-3 top-3.5 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 z-10"
        ),
        month_grid: "w-full border-collapse ml-0 pl-0",
        weekdays: "flex mb-2 justify-start ml-0 pl-0",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex items-center justify-center",
        week: "flex w-full mt-2 justify-start ml-0 pl-0",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground"
        ),
        selected:
          "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground rounded-full",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" {...props} />
        },
        Dropdown: ({ value, onChange, options, name }: DropdownProps) => {
          const selected = options?.find((option) => option.value === value)
          // name이 "year"이거나, label이 4자리 숫자(연도)인 경우 "년" 추가
          const isYear = name === "year" || (selected?.label && /^\d{4}$/.test(selected.label.toString()))
          const displayLabel = selected?.label 
            ? (isYear ? `${selected.label}년` : selected.label) 
            : ""

          return (
            <Select
              value={value?.toString()}
              onValueChange={(newValue) => {
                const changeEvent = {
                  target: { value: newValue },
                } as React.ChangeEvent<HTMLSelectElement>
                onChange?.(changeEvent)
              }}
            >
              <SelectTrigger className="h-8 w-auto min-w-[70px] border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm hover:bg-accent focus:ring-0 justify-start gap-2 [&>svg]:ml-auto">
                <SelectValue>{displayLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper">
                {options?.map((option) => {
                  const optionIsYear = name === "year" || (option.label && /^\d{4}$/.test(option.label.toString()))
                  return (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {optionIsYear ? `${option.label}년` : option.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

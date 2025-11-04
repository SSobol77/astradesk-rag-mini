"use client"

import type React from "react"

import { forwardRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface DatePickerProps {
  label?: string
  error?: string
  helperText?: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
  min?: string
  max?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, helperText, value, onChange, required, disabled, min, max }, ref) => {
    const [internalValue, setInternalValue] = useState(value || "")
    const inputId = label?.toLowerCase().replace(/\s+/g, "-")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)
      onChange?.(newValue)
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="date"
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
      </div>
    )
  },
)
DatePicker.displayName = "DatePicker"

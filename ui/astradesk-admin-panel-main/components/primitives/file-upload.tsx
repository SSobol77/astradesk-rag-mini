"use client"

import type React from "react"

import { forwardRef, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface FileUploadProps {
  label?: string
  error?: string
  helperText?: string
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  onChange?: (files: File[]) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, label, error, helperText, accept, multiple, maxSize, onChange, required, disabled }, ref) => {
    const [files, setFiles] = useState<File[]>([])
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const inputId = label?.toLowerCase().replace(/\s+/g, "-")

    const handleFiles = (fileList: FileList | null) => {
      if (!fileList) return

      const newFiles = Array.from(fileList)
      const validFiles = newFiles.filter((file) => {
        if (maxSize && file.size > maxSize) {
          console.warn(`File ${file.name} exceeds max size of ${maxSize} bytes`)
          return false
        }
        return true
      })

      setFiles(validFiles)
      onChange?.(validFiles)
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleFiles(e.dataTransfer.files)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-input bg-background p-6 transition-colors",
            dragActive && "border-primary bg-accent",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-destructive",
            className,
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={ref || inputRef}
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            className="sr-only"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="text-sm text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                Click to upload
              </Button>
              <span> or drag and drop</span>
            </div>
            {accept && <p className="text-xs text-muted-foreground">Accepted: {accept}</p>}
            {maxSize && <p className="text-xs text-muted-foreground">Max size: {formatFileSize(maxSize)}</p>}
          </div>
        </div>
        {files.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-accent rounded">
                <span className="truncate">{file.name}</span>
                <span className="text-muted-foreground ml-2">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
      </div>
    )
  },
)
FileUpload.displayName = "FileUpload"

/**
 * Validation utilities for form inputs and data
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === "") {
    return `${fieldName} is required`
  }
  return null
}

export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`
  }
  return null
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value.length > maxLength) {
    return `${fieldName} must be at most ${maxLength} characters`
  }
  return null
}

export function validatePattern(value: string, pattern: RegExp, fieldName: string, message?: string): string | null {
  if (!pattern.test(value)) {
    return message || `${fieldName} format is invalid`
  }
  return null
}

export function validateRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`
  }
  return null
}

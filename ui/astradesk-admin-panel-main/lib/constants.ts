/**
 * Application-wide constants
 */

export const APP_NAME = "AstraDesk Admin Portal"
export const APP_VERSION = "1.0.0"

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

export const DATE_FORMATS = {
  SHORT: "MMM d, yyyy",
  LONG: "MMMM d, yyyy",
  WITH_TIME: "MMM d, yyyy h:mm a",
  ISO: "yyyy-MM-dd",
} as const

export const STATUS_COLORS = {
  active: "text-green-600 bg-green-50",
  inactive: "text-gray-600 bg-gray-50",
  pending: "text-yellow-600 bg-yellow-50",
  error: "text-red-600 bg-red-50",
  success: "text-green-600 bg-green-50",
  warning: "text-yellow-600 bg-yellow-50",
  info: "text-blue-600 bg-blue-50",
} as const

export const AGENT_STATUSES = ["active", "inactive", "error"] as const
export const FLOW_STATUSES = ["active", "draft", "archived"] as const
export const JOB_STATUSES = ["scheduled", "running", "paused", "failed"] as const
export const RUN_STATUSES = ["pending", "running", "success", "error"] as const

export const REFRESH_INTERVALS = {
  DASHBOARD: 30000, // 30 seconds
  RUNS: 5000, // 5 seconds
  JOBS: 10000, // 10 seconds
  METRICS: 15000, // 15 seconds
} as const

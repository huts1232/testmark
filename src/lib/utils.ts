import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a URL by ensuring it has a protocol
 */
export function formatUrl(url: string): string {
  if (!url) return ""
  
  // Remove any whitespace
  url = url.trim()
  
  // If it already has a protocol, return as is
  if (url.match(/^https?:\/\//)) {
    return url
  }
  
  // Add https by default
  return `https://${url}`
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const formattedUrl = formatUrl(url)
    new URL(formattedUrl)
    return true
  } catch {
    return false
  }
}

/**
 * Extracts domain from URL for display purposes
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(formatUrl(url))
    return urlObj.hostname
  } catch {
    return url
  }
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return "Invalid date"
  }
  
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Formats a date to a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return "Unknown"
  }
  
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return formatDate(dateObj)
}

/**
 * Gets status color classes for badges and indicators
 */
export function getStatusColor(status: "healthy" | "unhealthy" | "pending" | "unknown"): string {
  switch (status) {
    case "healthy":
      return "bg-green-100 text-green-800 border-green-200"
    case "unhealthy":
      return "bg-red-100 text-red-800 border-red-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "unknown":
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

/**
 * Gets response time color based on performance
 */
export function getResponseTimeColor(responseTime: number): string {
  if (responseTime < 500) return "text-green-600"
  if (responseTime < 2000) return "text-yellow-600"
  return "text-red-600"
}

/**
 * Formats response time for display
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Generates a random ID for client-side use
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + "..."
}

/**
 * Debounce function for search inputs and API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

/**
 * Parses JSON safely with error handling
 */
export function safeParseJson<T = any>(json: string): T | null {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Formats file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Groups an array of objects by a key
 */
export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Checks if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

/**
 * Sleep utility for testing and development
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
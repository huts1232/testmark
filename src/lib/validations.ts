import { z } from 'zod'

// URL validation regex that matches most common URL patterns
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/

// Bookmark validation schemas
export const createBookmarkSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL must be less than 2048 characters')
    .regex(urlRegex, 'Please enter a valid URL (must include http:// or https://)')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),
  tags: z.array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  check_frequency: z.enum(['daily', 'weekly', 'monthly'])
    .default('weekly'),
  is_active: z.boolean().default(true)
})

export const updateBookmarkSchema = createBookmarkSchema.partial()

export const bulkImportBookmarksSchema = z.object({
  bookmarks: z.array(createBookmarkSchema)
    .min(1, 'At least one bookmark is required')
    .max(100, 'Maximum 100 bookmarks can be imported at once')
})

// Profile validation schemas
export const updateProfileSchema = z.object({
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim()
    .optional(),
  avatar_url: z.string()
    .url('Please enter a valid URL')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),
  timezone: z.string()
    .min(1, 'Timezone is required')
    .optional()
})

// Notification settings validation schemas
export const updateNotificationSettingsSchema = z.object({
  email_alerts: z.boolean().default(true),
  webhook_alerts: z.boolean().default(false),
  webhook_url: z.string()
    .url('Please enter a valid webhook URL')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),
  digest_frequency: z.enum(['never', 'daily', 'weekly'])
    .default('weekly'),
  alert_types: z.object({
    status_change: z.boolean().default(true),
    response_time: z.boolean().default(true),
    ssl_expiry: z.boolean().default(true)
  }).default({
    status_change: true,
    response_time: true,
    ssl_expiry: true
  })
})

// Health check validation schemas
export const healthCheckResponseSchema = z.object({
  status_code: z.number().int().min(100).max(599),
  response_time: z.number().min(0),
  is_up: z.boolean(),
  error_message: z.string().nullable().optional(),
  ssl_expiry: z.date().nullable().optional(),
  content_hash: z.string().optional()
})

// Alert validation schemas
export const createAlertSchema = z.object({
  bookmark_id: z.string().uuid('Invalid bookmark ID'),
  type: z.enum(['status_change', 'response_time', 'ssl_expiry', 'content_change']),
  message: z.string().min(1).max(500),
  is_resolved: z.boolean().default(false)
})

export const updateAlertSchema = z.object({
  is_resolved: z.boolean()
})

export const alertFiltersSchema = z.object({
  type: z.enum(['status_change', 'response_time', 'ssl_expiry', 'content_change']).optional(),
  is_resolved: z.boolean().optional(),
  bookmark_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
})

// Search and filter schemas
export const bookmarkFiltersSchema = z.object({
  search: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['all', 'up', 'down', 'unknown']).default('all'),
  check_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  is_active: z.boolean().optional(),
  sort_by: z.enum(['title', 'url', 'created_at', 'last_checked', 'status'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

// Browser bookmark import validation
export const browserBookmarkSchema = z.object({
  title: z.string().min(1).max(255),
  url: z.string().regex(urlRegex),
  folder: z.string().optional(),
  date_added: z.number().optional()
})

export const importBrowserBookmarksSchema = z.object({
  bookmarks: z.array(browserBookmarkSchema)
    .min(1, 'At least one bookmark is required')
    .max(1000, 'Maximum 1000 bookmarks can be imported at once'),
  import_inactive: z.boolean().default(false),
  default_check_frequency: z.enum(['daily', 'weekly', 'monthly'])
    .default('weekly')
})

// API response schemas for type inference
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
})

// Type exports for use in components
export type CreateBookmarkData = z.infer<typeof createBookmarkSchema>
export type UpdateBookmarkData = z.infer<typeof updateBookmarkSchema>
export type BulkImportBookmarksData = z.infer<typeof bulkImportBookmarksSchema>
export type UpdateProfileData = z.infer<typeof updateProfileSchema>
export type UpdateNotificationSettingsData = z.infer<typeof updateNotificationSettingsSchema>
export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>
export type CreateAlertData = z.infer<typeof createAlertSchema>
export type UpdateAlertData = z.infer<typeof updateAlertSchema>
export type AlertFilters = z.infer<typeof alertFiltersSchema>
export type BookmarkFilters = z.infer<typeof bookmarkFiltersSchema>
export type BrowserBookmark = z.infer<typeof browserBookmarkSchema>
export type ImportBrowserBookmarksData = z.infer<typeof importBrowserBookmarksSchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>
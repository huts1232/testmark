export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          title: string
          url: string
          description: string | null
          tags: string[]
          folder: string | null
          favicon_url: string | null
          is_active: boolean
          check_frequency: 'hourly' | 'daily' | 'weekly'
          last_checked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          url: string
          description?: string | null
          tags?: string[]
          folder?: string | null
          favicon_url?: string | null
          is_active?: boolean
          check_frequency?: 'hourly' | 'daily' | 'weekly'
          last_checked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          url?: string
          description?: string | null
          tags?: string[]
          folder?: string | null
          favicon_url?: string | null
          is_active?: boolean
          check_frequency?: 'hourly' | 'daily' | 'weekly'
          last_checked_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      health_checks: {
        Row: {
          id: string
          bookmark_id: string
          status_code: number
          response_time: number
          is_healthy: boolean
          error_message: string | null
          checked_at: string
          created_at: string
        }
        Insert: {
          id?: string
          bookmark_id: string
          status_code: number
          response_time: number
          is_healthy: boolean
          error_message?: string | null
          checked_at: string
          created_at?: string
        }
        Update: {
          id?: string
          bookmark_id?: string
          status_code?: number
          response_time?: number
          is_healthy?: boolean
          error_message?: string | null
          checked_at?: string
          created_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          email_enabled: boolean
          push_enabled: boolean
          slack_webhook_url: string | null
          discord_webhook_url: string | null
          notify_on_failure: boolean
          notify_on_recovery: boolean
          notify_on_slow_response: boolean
          slow_response_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_enabled?: boolean
          push_enabled?: boolean
          slack_webhook_url?: string | null
          discord_webhook_url?: string | null
          notify_on_failure?: boolean
          notify_on_recovery?: boolean
          notify_on_slow_response?: boolean
          slow_response_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_enabled?: boolean
          push_enabled?: boolean
          slack_webhook_url?: string | null
          discord_webhook_url?: string | null
          notify_on_failure?: boolean
          notify_on_recovery?: boolean
          notify_on_slow_response?: boolean
          slow_response_threshold?: number
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          bookmark_id: string
          type: 'failure' | 'recovery' | 'slow_response'
          message: string
          is_read: boolean
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bookmark_id: string
          type: 'failure' | 'recovery' | 'slow_response'
          message: string
          is_read?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bookmark_id?: string
          type?: 'failure' | 'recovery' | 'slow_response'
          message?: string
          is_read?: boolean
          sent_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type HealthCheck = Database['public']['Tables']['health_checks']['Row']
export type NotificationSettings = Database['public']['Tables']['notification_settings']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']

export type InsertBookmark = Database['public']['Tables']['bookmarks']['Insert']
export type UpdateBookmark = Database['public']['Tables']['bookmarks']['Update']
export type InsertHealthCheck = Database['public']['Tables']['health_checks']['Insert']
export type InsertAlert = Database['public']['Tables']['alerts']['Insert']
export type UpdateNotificationSettings = Database['public']['Tables']['notification_settings']['Update']

// Extended types with relationships
export interface BookmarkWithHealthCheck extends Bookmark {
  latest_health_check?: HealthCheck
  health_checks?: HealthCheck[]
}

export interface BookmarkWithStats extends Bookmark {
  total_checks: number
  success_rate: number
  avg_response_time: number
  uptime_percentage: number
}

export interface AlertWithBookmark extends Alert {
  bookmark: {
    title: string
    url: string
    favicon_url: string | null
  }
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// Form types
export interface BookmarkFormData {
  title: string
  url: string
  description?: string
  tags: string[]
  folder?: string
  check_frequency: 'hourly' | 'daily' | 'weekly'
  is_active: boolean
}

export interface ImportBookmarkData {
  title: string
  url: string
  description?: string
  folder?: string
}

export interface NotificationSettingsFormData {
  email_enabled: boolean
  push_enabled: boolean
  slack_webhook_url?: string
  discord_webhook_url?: string
  notify_on_failure: boolean
  notify_on_recovery: boolean
  notify_on_slow_response: boolean
  slow_response_threshold: number
}

// Dashboard stats types
export interface DashboardStats {
  total_bookmarks: number
  active_bookmarks: number
  healthy_bookmarks: number
  failed_bookmarks: number
  avg_response_time: number
  uptime_percentage: number
  recent_alerts: Alert[]
  checks_today: number
}

// Health check status types
export type HealthStatus = 'healthy' | 'unhealthy' | 'warning' | 'unknown'

export interface HealthStatusInfo {
  status: HealthStatus
  color: string
  icon: string
  label: string
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface ToastNotification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

// Filter and sorting types
export interface BookmarkFilters {
  search?: string
  folder?: string
  tags?: string[]
  status?: HealthStatus
  check_frequency?: 'hourly' | 'daily' | 'weekly'
  is_active?: boolean
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// Billing and subscription types
export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  bookmark_limit: number
  check_frequency_options: ('hourly' | 'daily' | 'weekly')[]
}

export interface UsageStats {
  bookmarks_used: number
  bookmarks_limit: number
  checks_this_month: number
  checks_limit: number
}
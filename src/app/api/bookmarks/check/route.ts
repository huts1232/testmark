import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Database types
interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string
  description?: string
  tags: string[]
  is_active: boolean
  check_interval: number
  created_at: string
  updated_at: string
}

interface HealthCheck {
  id: string
  bookmark_id: string
  status_code: number
  response_time: number
  is_healthy: boolean
  error_message?: string
  checked_at: string
}

export async function POST(request: Request) {
  try {
    // Create Supabase client with auth context
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          getSession: async () => {
            const authToken = cookieStore.get('sb-access-token')?.value
            if (!authToken) return { data: { session: null }, error: null }
            
            const { data, error } = await createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ).auth.getSession()
            
            return { data, error }
          }
        }
      }
    )

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const { bookmarkId } = await request.json()

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      )
    }

    // Verify bookmark ownership
    const { data: bookmark, error: bookmarkError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', bookmarkId)
      .eq('user_id', user.id)
      .single()

    if (bookmarkError || !bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    // Perform health check
    const healthCheckResult = await performHealthCheck(bookmark.url)

    // Store health check result
    const { data: healthCheck, error: insertError } = await supabase
      .from('health_checks')
      .insert({
        bookmark_id: bookmarkId,
        status_code: healthCheckResult.statusCode,
        response_time: healthCheckResult.responseTime,
        is_healthy: healthCheckResult.isHealthy,
        error_message: healthCheckResult.errorMessage,
        checked_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting health check:', insertError)
      return NextResponse.json(
        { error: 'Failed to save health check result' },
        { status: 500 }
      )
    }

    // Update bookmark's last_checked timestamp
    await supabase
      .from('bookmarks')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bookmarkId)

    // Check if we need to create an alert for unhealthy status
    if (!healthCheckResult.isHealthy) {
      await createAlertIfNeeded(supabase, user.id, bookmarkId, healthCheckResult)
    }

    return NextResponse.json({
      success: true,
      healthCheck: {
        id: healthCheck.id,
        statusCode: healthCheck.status_code,
        responseTime: healthCheck.response_time,
        isHealthy: healthCheck.is_healthy,
        errorMessage: healthCheck.error_message,
        checkedAt: healthCheck.checked_at
      }
    })

  } catch (error) {
    console.error('Error in health check API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Perform actual health check on the URL
async function performHealthCheck(url: string) {
  const startTime = Date.now()
  
  try {
    // Validate URL format
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return {
        statusCode: 0,
        responseTime: 0,
        isHealthy: false,
        errorMessage: 'Invalid URL format'
      }
    }

    // Make HTTP request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(targetUrl.toString(), {
      method: 'HEAD', // Use HEAD to minimize data transfer
      signal: controller.signal,
      headers: {
        'User-Agent': 'TestMark Health Checker/1.0'
      },
      // Don't follow redirects automatically to get actual status
      redirect: 'manual'
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    // Consider 2xx and 3xx as healthy
    const isHealthy = response.status >= 200 && response.status < 400

    return {
      statusCode: response.status,
      responseTime,
      isHealthy,
      errorMessage: isHealthy ? null : `HTTP ${response.status}: ${response.statusText}`
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          statusCode: 0,
          responseTime,
          isHealthy: false,
          errorMessage: 'Request timeout (30s)'
        }
      }
      
      return {
        statusCode: 0,
        responseTime,
        isHealthy: false,
        errorMessage: error.message
      }
    }

    return {
      statusCode: 0,
      responseTime,
      isHealthy: false,
      errorMessage: 'Unknown error occurred'
    }
  }
}

// Create alert if bookmark is unhealthy and user has notifications enabled
async function createAlertIfNeeded(
  supabase: any,
  userId: string,
  bookmarkId: string,
  healthCheck: any
) {
  try {
    // Check user's notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // If no settings or notifications disabled, skip
    if (!settings || !settings.email_enabled) {
      return
    }

    // Check if we already have a recent alert for this bookmark
    const { data: recentAlerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('bookmark_id', bookmarkId)
      .eq('is_resolved', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    // Don't spam alerts - only create if no unresolved alerts in last 24h
    if (recentAlerts && recentAlerts.length > 0) {
      return
    }

    // Create new alert
    await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        bookmark_id: bookmarkId,
        alert_type: 'health_check_failed',
        title: 'Bookmark Health Check Failed',
        message: `Your bookmark failed a health check. Status: ${healthCheck.statusCode}${healthCheck.errorMessage ? ` - ${healthCheck.errorMessage}` : ''}`,
        severity: 'warning',
        is_resolved: false,
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Error creating alert:', error)
    // Don't throw - alert creation failure shouldn't fail the health check
  }
}
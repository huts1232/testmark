import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface HealthCheckResult {
  url: string
  status: 'success' | 'error' | 'timeout'
  statusCode?: number
  responseTime: number
  errorMessage?: string
  timestamp: Date
}

export interface BookmarkHealthStatus {
  id: string
  url: string
  title: string
  isHealthy: boolean
  lastChecked: Date | null
  lastError?: string
}

/**
 * Check the health status of a single URL
 */
export async function checkUrlHealth(url: string): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    // Validate URL format
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading full content
      signal: controller.signal,
      headers: {
        'User-Agent': 'TestMark Health Checker/1.0',
        'Accept': '*/*',
      },
      redirect: 'follow'
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return {
      url,
      status: response.ok ? 'success' : 'error',
      statusCode: response.status,
      responseTime,
      errorMessage: !response.ok ? `HTTP ${response.status} ${response.statusText}` : undefined,
      timestamp: new Date()
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          url,
          status: 'timeout',
          responseTime,
          errorMessage: 'Request timed out after 30 seconds',
          timestamp: new Date()
        }
      }
      
      return {
        url,
        status: 'error',
        responseTime,
        errorMessage: error.message,
        timestamp: new Date()
      }
    }

    return {
      url,
      status: 'error',
      responseTime,
      errorMessage: 'Unknown error occurred',
      timestamp: new Date()
    }
  }
}

/**
 * Check health status for multiple URLs in parallel with rate limiting
 */
export async function checkMultipleUrls(
  urls: string[],
  maxConcurrent: number = 5
): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = []
  
  // Process URLs in batches to avoid overwhelming servers
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent)
    const batchPromises = batch.map(url => checkUrlHealth(url))
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Add small delay between batches
    if (i + maxConcurrent < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

/**
 * Save health check results to the database
 */
export async function saveHealthCheckResults(
  userId: string,
  results: HealthCheckResult[]
): Promise<void> {
  try {
    // Get bookmark IDs for the URLs
    const { data: bookmarks, error: bookmarkError } = await supabase
      .from('bookmarks')
      .select('id, url')
      .eq('user_id', userId)
      .in('url', results.map(r => r.url))

    if (bookmarkError) {
      throw new Error(`Failed to fetch bookmarks: ${bookmarkError.message}`)
    }

    // Create a mapping of URL to bookmark ID
    const urlToBookmarkId = new Map(
      bookmarks?.map(b => [b.url, b.id]) || []
    )

    // Prepare health check records
    const healthCheckRecords = results
      .filter(result => urlToBookmarkId.has(result.url))
      .map(result => ({
        bookmark_id: urlToBookmarkId.get(result.url),
        status: result.status,
        status_code: result.statusCode,
        response_time_ms: result.responseTime,
        error_message: result.errorMessage,
        checked_at: result.timestamp.toISOString()
      }))

    if (healthCheckRecords.length === 0) {
      return
    }

    // Insert health check records
    const { error: insertError } = await supabase
      .from('health_checks')
      .insert(healthCheckRecords)

    if (insertError) {
      throw new Error(`Failed to save health check results: ${insertError.message}`)
    }

    // Update bookmark statuses
    const updatePromises = results.map(async (result) => {
      const bookmarkId = urlToBookmarkId.get(result.url)
      if (!bookmarkId) return

      const { error } = await supabase
        .from('bookmarks')
        .update({
          is_healthy: result.status === 'success',
          last_checked_at: result.timestamp.toISOString(),
          last_error: result.status === 'success' ? null : result.errorMessage
        })
        .eq('id', bookmarkId)

      if (error) {
        console.error(`Failed to update bookmark ${bookmarkId}:`, error)
      }
    })

    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error saving health check results:', error)
    throw error
  }
}

/**
 * Get health status for user's bookmarks
 */
export async function getUserBookmarkHealthStatus(
  userId: string
): Promise<BookmarkHealthStatus[]> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        url,
        title,
        is_healthy,
        last_checked_at,
        last_error
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch bookmark health status: ${error.message}`)
    }

    return (data || []).map(bookmark => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      isHealthy: bookmark.is_healthy ?? true,
      lastChecked: bookmark.last_checked_at ? new Date(bookmark.last_checked_at) : null,
      lastError: bookmark.last_error || undefined
    }))
  } catch (error) {
    console.error('Error fetching bookmark health status:', error)
    throw error
  }
}

/**
 * Check if a URL change indicates a potential issue
 */
export function detectHealthIssues(
  previousResult: HealthCheckResult | null,
  currentResult: HealthCheckResult
): {
  hasIssue: boolean
  severity: 'low' | 'medium' | 'high'
  description: string
} {
  // New failure
  if (currentResult.status !== 'success') {
    return {
      hasIssue: true,
      severity: currentResult.status === 'timeout' ? 'medium' : 'high',
      description: currentResult.errorMessage || 'URL is not accessible'
    }
  }

  // No previous result to compare
  if (!previousResult) {
    return {
      hasIssue: false,
      severity: 'low',
      description: 'URL is healthy'
    }
  }

  // Recovered from failure
  if (previousResult.status !== 'success' && currentResult.status === 'success') {
    return {
      hasIssue: false,
      severity: 'low',
      description: 'URL has recovered and is now healthy'
    }
  }

  // Significant performance degradation
  if (
    previousResult.responseTime > 0 &&
    currentResult.responseTime > previousResult.responseTime * 3 &&
    currentResult.responseTime > 5000
  ) {
    return {
      hasIssue: true,
      severity: 'low',
      description: `Slow response time: ${currentResult.responseTime}ms (previously ${previousResult.responseTime}ms)`
    }
  }

  // Status code changed
  if (
    previousResult.statusCode &&
    currentResult.statusCode &&
    previousResult.statusCode !== currentResult.statusCode
  ) {
    return {
      hasIssue: true,
      severity: 'medium',
      description: `Status code changed from ${previousResult.statusCode} to ${currentResult.statusCode}`
    }
  }

  return {
    hasIssue: false,
    severity: 'low',
    description: 'URL is healthy'
  }
}

/**
 * Get health check history for a specific bookmark
 */
export async function getBookmarkHealthHistory(
  bookmarkId: string,
  limit: number = 50
): Promise<HealthCheckResult[]> {
  try {
    const { data, error } = await supabase
      .from('health_checks')
      .select(`
        status,
        status_code,
        response_time_ms,
        error_message,
        checked_at,
        bookmark:bookmarks(url)
      `)
      .eq('bookmark_id', bookmarkId)
      .order('checked_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch health check history: ${error.message}`)
    }

    return (data || []).map(record => ({
      url: record.bookmark?.url || '',
      status: record.status as 'success' | 'error' | 'timeout',
      statusCode: record.status_code || undefined,
      responseTime: record.response_time_ms,
      errorMessage: record.error_message || undefined,
      timestamp: new Date(record.checked_at)
    }))
  } catch (error) {
    console.error('Error fetching health check history:', error)
    throw error
  }
}
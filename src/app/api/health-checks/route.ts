import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const bookmarkId = searchParams.get('bookmark_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    // Build base query
    let query = supabase
      .from('health_checks')
      .select(`
        id,
        bookmark_id,
        status,
        response_time,
        status_code,
        error_message,
        checked_at,
        bookmarks (
          id,
          url,
          title
        )
      `)
      .eq('bookmarks.user_id', session.user.id)
      .order('checked_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (bookmarkId) {
      query = query.eq('bookmark_id', bookmarkId)
    }
    
    if (status && ['up', 'down', 'error'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: healthChecks, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching health checks:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch health check history' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('health_checks')
      .select('*', { count: 'exact', head: true })
      .eq('bookmarks.user_id', session.user.id)

    if (bookmarkId) {
      countQuery = countQuery.eq('bookmark_id', bookmarkId)
    }

    if (status && ['up', 'down', 'error'].includes(status)) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error getting health checks count:', countError)
      return NextResponse.json(
        { error: 'Failed to get health check count' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const currentPage = Math.floor(offset / limit) + 1
    const hasNext = currentPage < totalPages
    const hasPrevious = currentPage > 1

    return NextResponse.json({
      health_checks: healthChecks || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        current_page: currentPage,
        total_pages: totalPages,
        has_next: hasNext,
        has_previous: hasPrevious
      }
    })

  } catch (error) {
    console.error('Unexpected error in health-checks API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
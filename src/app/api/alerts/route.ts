import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const bookmarkId = searchParams.get('bookmark_id')
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build base query
    let query = supabase
      .from('alerts')
      .select(`
        id,
        bookmark_id,
        alert_type,
        message,
        status,
        resolved_at,
        created_at,
        bookmarks (
          id,
          title,
          url,
          folder
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (bookmarkId) {
      query = query.eq('bookmark_id', bookmarkId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: alerts, error: alertsError } = await query

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError)
      return Response.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    if (bookmarkId) {
      countQuery = countQuery.eq('bookmark_id', bookmarkId)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error fetching alert count:', countError)
      return Response.json(
        { error: 'Failed to fetch alert count' },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return Response.json({
      alerts: alerts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('Unexpected error in alerts API:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
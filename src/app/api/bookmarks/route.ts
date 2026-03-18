import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createBookmarkSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  tags: z.array(z.string()).optional(),
  check_frequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
  is_active: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const status = searchParams.get('status') // 'active', 'inactive', 'error'
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortOrder = searchParams.get('order') || 'desc'

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('bookmarks')
      .select(`
        id,
        url,
        title,
        description,
        tags,
        check_frequency,
        is_active,
        created_at,
        updated_at,
        last_checked_at,
        last_status_code,
        last_response_time,
        health_checks!inner(
          id,
          status_code,
          response_time,
          is_healthy,
          checked_at
        )
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,url.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (status === 'error') {
      query = query.eq('is_active', true).not('last_status_code', 'gte', 200).not('last_status_code', 'lt', 300)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'last_checked_at', 'last_response_time']
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    query = query.range(from, to)

    const { data: bookmarks, error, count } = await query

    if (error) {
      console.error('Error fetching bookmarks:', error)
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error counting bookmarks:', countError)
    }

    // Transform data to include latest health check info
    const transformedBookmarks = bookmarks?.map(bookmark => {
      const latestHealthCheck = bookmark.health_checks?.[0]
      return {
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
        tags: bookmark.tags || [],
        check_frequency: bookmark.check_frequency,
        is_active: bookmark.is_active,
        created_at: bookmark.created_at,
        updated_at: bookmark.updated_at,
        last_checked_at: bookmark.last_checked_at,
        last_status_code: bookmark.last_status_code,
        last_response_time: bookmark.last_response_time,
        is_healthy: latestHealthCheck?.is_healthy ?? null
      }
    }) || []

    return NextResponse.json({
      bookmarks: transformedBookmarks,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = createBookmarkSchema.parse(body)

    // Check if URL already exists for this user
    const { data: existingBookmark, error: checkError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', validatedData.url)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing bookmark:', checkError)
      return NextResponse.json({ error: 'Failed to validate bookmark' }, { status: 500 })
    }

    if (existingBookmark) {
      return NextResponse.json({ 
        error: 'A bookmark with this URL already exists' 
      }, { status: 409 })
    }

    // Create the bookmark
    const { data: bookmark, error: insertError } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        url: validatedData.url,
        title: validatedData.title,
        description: validatedData.description || null,
        tags: validatedData.tags || [],
        check_frequency: validatedData.check_frequency,
        is_active: validatedData.is_active
      })
      .select(`
        id,
        url,
        title,
        description,
        tags,
        check_frequency,
        is_active,
        created_at,
        updated_at
      `)
      .single()

    if (insertError) {
      console.error('Error creating bookmark:', insertError)
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
    }

    // Trigger initial health check if bookmark is active
    if (validatedData.is_active) {
      try {
        // This will be handled by a background job or webhook
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookmarks/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookmark_id: bookmark.id })
        })
      } catch (error) {
        // Don't fail the bookmark creation if health check fails
        console.warn('Failed to trigger initial health check:', error)
      }
    }

    return NextResponse.json({
      bookmark: {
        ...bookmark,
        tags: bookmark.tags || [],
        is_healthy: null,
        last_checked_at: null,
        last_status_code: null,
        last_response_time: null
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues
      }, { status: 400 })
    }

    console.error('Unexpected error in POST /api/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
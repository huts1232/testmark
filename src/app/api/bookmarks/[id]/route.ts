import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get bookmark with health check data
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        health_checks (
          id,
          status,
          response_time,
          checked_at,
          error_message,
          status_code
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .order('checked_at', { foreignTable: 'health_checks', ascending: false })
      .limit(1, { foreignTable: 'health_checks' })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ bookmark })
  } catch (error) {
    console.error('Error fetching bookmark:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, url, tags, check_interval, description } = body

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Validate check_interval if provided
    if (check_interval && ![5, 15, 30, 60, 180, 360, 720, 1440].includes(check_interval)) {
      return NextResponse.json(
        { error: 'Invalid check interval' },
        { status: 400 }
      )
    }

    // Check if bookmark exists and belongs to user
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!existingBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    // Update bookmark
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .update({
        title: title.trim(),
        url: url.trim(),
        tags: Array.isArray(tags) ? tags : [],
        check_interval: check_interval || 60,
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ bookmark })
  } catch (error) {
    console.error('Error updating bookmark:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if bookmark exists and belongs to user
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id, title')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!existingBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    // Delete related health checks and alerts first (cascade should handle this, but being explicit)
    await supabase
      .from('health_checks')
      .delete()
      .eq('bookmark_id', params.id)

    await supabase
      .from('alerts')
      .delete()
      .eq('bookmark_id', params.id)

    // Delete the bookmark
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      message: 'Bookmark deleted successfully',
      deleted_bookmark: existingBookmark
    })
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ImportSchema = z.object({
  content: z.string(),
  format: z.enum(['html', 'netscape']),
})

interface ParsedBookmark {
  title: string
  url: string
  folder?: string
  description?: string
  tags?: string[]
  dateAdded?: Date
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = ImportSchema.parse(body)

    // Parse bookmarks based on format
    let bookmarks: ParsedBookmark[] = []
    
    if (validatedData.format === 'html' || validatedData.format === 'netscape') {
      bookmarks = parseNetscapeBookmarks(validatedData.content)
    }

    if (bookmarks.length === 0) {
      return NextResponse.json(
        { error: 'No valid bookmarks found in file' },
        { status: 400 }
      )
    }

    // Filter out invalid URLs and duplicates
    const validBookmarks = bookmarks.filter(bookmark => {
      try {
        new URL(bookmark.url)
        return true
      } catch {
        return false
      }
    })

    if (validBookmarks.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs found in bookmarks' },
        { status: 400 }
      )
    }

    // Check for existing bookmarks to avoid duplicates
    const existingUrls = new Set()
    const { data: existingBookmarks } = await supabase
      .from('bookmarks')
      .select('url')
      .eq('user_id', user.id)

    if (existingBookmarks) {
      existingBookmarks.forEach(bookmark => existingUrls.add(bookmark.url))
    }

    // Filter out existing bookmarks
    const newBookmarks = validBookmarks.filter(bookmark => 
      !existingUrls.has(bookmark.url)
    )

    if (newBookmarks.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: validBookmarks.length,
        total: bookmarks.length,
        message: 'All bookmarks already exist'
      })
    }

    // Prepare bookmarks for insertion
    const bookmarksToInsert = newBookmarks.map(bookmark => ({
      user_id: user.id,
      url: bookmark.url,
      title: bookmark.title || extractDomainFromUrl(bookmark.url),
      description: bookmark.description || null,
      folder: bookmark.folder || null,
      tags: bookmark.tags || [],
      is_active: true,
      check_frequency: 'daily' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Insert bookmarks in batches to avoid hitting limits
    const batchSize = 100
    let insertedCount = 0
    const errors: string[] = []

    for (let i = 0; i < bookmarksToInsert.length; i += batchSize) {
      const batch = bookmarksToInsert.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('bookmarks')
        .insert(batch)
        .select('id')

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else if (data) {
        insertedCount += data.length
      }
    }

    // If there were errors but some bookmarks were inserted
    if (errors.length > 0 && insertedCount > 0) {
      return NextResponse.json({
        success: true,
        imported: insertedCount,
        skipped: validBookmarks.length - newBookmarks.length,
        total: bookmarks.length,
        errors,
        message: `Imported ${insertedCount} bookmarks with some errors`
      }, { status: 207 }) // Multi-status
    }

    // If there were errors and no bookmarks were inserted
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Failed to import bookmarks',
          details: errors
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: insertedCount,
      skipped: validBookmarks.length - newBookmarks.length,
      total: bookmarks.length,
      message: `Successfully imported ${insertedCount} bookmarks`
    })

  } catch (error) {
    console.error('Import bookmarks error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function parseNetscapeBookmarks(content: string): ParsedBookmark[] {
  const bookmarks: ParsedBookmark[] = []
  const lines = content.split('\n')
  
  let currentFolder = ''
  const folderStack: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Handle folder start
    if (line.includes('<H3') && line.includes('FOLDED')) {
      const titleMatch = line.match(/>([^<]+)</)?.[1]
      if (titleMatch) {
        currentFolder = titleMatch.trim()
        folderStack.push(currentFolder)
      }
    }
    
    // Handle folder end
    if (line.includes('</DL>') && folderStack.length > 0) {
      folderStack.pop()
      currentFolder = folderStack[folderStack.length - 1] || ''
    }
    
    // Handle bookmarks
    if (line.includes('<A HREF=')) {
      const urlMatch = line.match(/HREF="([^"]+)"/)?.[1]
      const titleMatch = line.match(/>([^<]+)</)?.[1]
      const addDateMatch = line.match(/ADD_DATE="(\d+)"/)?.[1]
      
      if (urlMatch && titleMatch) {
        const bookmark: ParsedBookmark = {
          url: urlMatch,
          title: titleMatch.trim(),
          folder: currentFolder || undefined,
        }
        
        // Parse add date if available
        if (addDateMatch) {
          bookmark.dateAdded = new Date(parseInt(addDateMatch) * 1000)
        }
        
        // Look for description in next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim()
          if (nextLine.includes('<DD>')) {
            const descMatch = nextLine.match(/<DD>(.+)/)?.[1]
            if (descMatch) {
              bookmark.description = descMatch.replace(/<[^>]*>/g, '').trim()
            }
          }
        }
        
        bookmarks.push(bookmark)
      }
    }
  }
  
  return bookmarks
}

function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}
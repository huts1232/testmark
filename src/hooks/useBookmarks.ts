'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  tags: string[]
  folder?: string
  is_active: boolean
  check_frequency: number
  created_at: string
  updated_at: string
  user_id: string
  last_check_at?: string
  status?: 'healthy' | 'unhealthy' | 'unknown'
  response_time?: number
  status_code?: number
}

interface UseBookmarksReturn {
  bookmarks: Bookmark[]
  isLoading: boolean
  error: string | null
  createBookmark: (bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<boolean>
  updateBookmark: (id: string, bookmark: Partial<Bookmark>) => Promise<boolean>
  deleteBookmark: (id: string) => Promise<boolean>
  checkBookmark: (id: string) => Promise<boolean>
  importBookmarks: (file: File) => Promise<boolean>
  refreshBookmarks: () => Promise<void>
  bulkUpdateBookmarks: (ids: string[], updates: Partial<Bookmark>) => Promise<boolean>
  searchBookmarks: (query: string) => Bookmark[]
  filterBookmarks: (filters: BookmarkFilters) => Bookmark[]
}

interface BookmarkFilters {
  status?: 'healthy' | 'unhealthy' | 'unknown'
  tags?: string[]
  folder?: string
  is_active?: boolean
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch all bookmarks
  const fetchBookmarks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/bookmarks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth')
          return
        }
        throw new Error(`Failed to fetch bookmarks: ${response.statusText}`)
      }

      const data = await response.json()
      setBookmarks(data.bookmarks || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookmarks'
      setError(errorMessage)
      console.error('Error fetching bookmarks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Create a new bookmark
  const createBookmark = useCallback(async (
    bookmarkData: Omit<Bookmark, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarkData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create bookmark')
      }

      const data = await response.json()
      
      // Add the new bookmark to the state
      setBookmarks(prev => [data.bookmark, ...prev])
      
      toast({
        title: 'Bookmark created',
        description: `Successfully created bookmark for ${bookmarkData.title || bookmarkData.url}`
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bookmark'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [toast])

  // Update an existing bookmark
  const updateBookmark = useCallback(async (id: string, updates: Partial<Bookmark>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update bookmark')
      }

      const data = await response.json()
      
      // Update the bookmark in state
      setBookmarks(prev => prev.map(bookmark => 
        bookmark.id === id ? { ...bookmark, ...data.bookmark } : bookmark
      ))
      
      toast({
        title: 'Bookmark updated',
        description: 'Successfully updated bookmark'
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bookmark'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [toast])

  // Delete a bookmark
  const deleteBookmark = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete bookmark')
      }

      // Remove the bookmark from state
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id))
      
      toast({
        title: 'Bookmark deleted',
        description: 'Successfully deleted bookmark'
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bookmark'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [toast])

  // Check a bookmark's health
  const checkBookmark = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/bookmarks/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmark_id: id })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to check bookmark')
      }

      const data = await response.json()
      
      // Update bookmark with health check results
      setBookmarks(prev => prev.map(bookmark => 
        bookmark.id === id ? {
          ...bookmark,
          last_check_at: data.health_check.checked_at,
          status: data.health_check.status,
          response_time: data.health_check.response_time,
          status_code: data.health_check.status_code
        } : bookmark
      ))
      
      toast({
        title: 'Bookmark checked',
        description: `Status: ${data.health_check.status} (${data.health_check.status_code})`
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check bookmark'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [toast])

  // Import bookmarks from file
  const importBookmarks = useCallback(async (file: File): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/bookmarks/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to import bookmarks')
      }

      const data = await response.json()
      
      // Refresh bookmarks list
      await fetchBookmarks()
      
      toast({
        title: 'Import successful',
        description: `Imported ${data.imported_count} bookmarks`
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import bookmarks'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [fetchBookmarks, toast])

  // Bulk update multiple bookmarks
  const bulkUpdateBookmarks = useCallback(async (ids: string[], updates: Partial<Bookmark>): Promise<boolean> => {
    try {
      const promises = ids.map(id => updateBookmark(id, updates))
      const results = await Promise.allSettled(promises)
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value === true).length
      const failed = results.length - successful
      
      if (failed > 0) {
        toast({
          title: 'Partial success',
          description: `Updated ${successful} bookmarks, ${failed} failed`,
          variant: 'destructive'
        })
        return false
      }
      
      toast({
        title: 'Bulk update successful',
        description: `Updated ${successful} bookmarks`
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update bookmarks'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [updateBookmark, toast])

  // Search bookmarks by query
  const searchBookmarks = useCallback((query: string): Bookmark[] => {
    if (!query.trim()) return bookmarks
    
    const lowercaseQuery = query.toLowerCase()
    return bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(lowercaseQuery) ||
      bookmark.url.toLowerCase().includes(lowercaseQuery) ||
      bookmark.description?.toLowerCase().includes(lowercaseQuery) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      bookmark.folder?.toLowerCase().includes(lowercaseQuery)
    )
  }, [bookmarks])

  // Filter bookmarks by various criteria
  const filterBookmarks = useCallback((filters: BookmarkFilters): Bookmark[] => {
    return bookmarks.filter(bookmark => {
      if (filters.status && bookmark.status !== filters.status) return false
      if (filters.is_active !== undefined && bookmark.is_active !== filters.is_active) return false
      if (filters.folder && bookmark.folder !== filters.folder) return false
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => bookmark.tags.includes(tag))
        if (!hasMatchingTag) return false
      }
      return true
    })
  }, [bookmarks])

  // Refresh bookmarks (alias for fetchBookmarks)
  const refreshBookmarks = useCallback(async () => {
    await fetchBookmarks()
  }, [fetchBookmarks])

  // Initial fetch on mount
  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  return {
    bookmarks,
    isLoading,
    error,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    checkBookmark,
    importBookmarks,
    refreshBookmarks,
    bulkUpdateBookmarks,
    searchBookmarks,
    filterBookmarks
  }
}
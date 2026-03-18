import { createServerComponentClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Upload, MoreVertical, ExternalLink, Trash2, Edit, RefreshCw, FileText, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { BookmarkForm } from './bookmark-form'
import { ImportDialog } from './import-dialog'
import { DeleteDialog } from './delete-dialog'

interface Bookmark {
  id: string
  url: string
  title?: string
  tags?: string[]
  category?: string
  created_at: string
  updated_at: string
  last_checked?: string
  status: 'healthy' | 'broken' | 'pending' | 'unknown'
  status_code?: number
  response_time?: number
}

async function getBookmarks(): Promise<Bookmark[]> {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth')
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      url,
      title,
      tags,
      category,
      created_at,
      updated_at,
      health_checks (
        status,
        status_code,
        response_time,
        checked_at
      )
    `)
    .eq('profile_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookmarks:', error)
    return []
  }

  return data?.map(bookmark => ({
    id: bookmark.id,
    url: bookmark.url,
    title: bookmark.title,
    tags: bookmark.tags,
    category: bookmark.category,
    created_at: bookmark.created_at,
    updated_at: bookmark.updated_at,
    last_checked: bookmark.health_checks?.[0]?.checked_at,
    status: bookmark.health_checks?.[0]?.status || 'unknown',
    status_code: bookmark.health_checks?.[0]?.status_code,
    response_time: bookmark.health_checks?.[0]?.response_time,
  })) || []
}

function getStatusBadge(status: Bookmark['status']) {
  switch (status) {
    case 'healthy':
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Healthy</Badge>
    case 'broken':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Broken</Badge>
    case 'pending':
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    default:
      return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Unknown</Badge>
  }
}

function formatResponseTime(ms?: number): string {
  if (!ms) return 'N/A'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default async function BookmarksPage() {
  const bookmarks = await getBookmarks()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bookmarks</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your bookmarked URLs
          </p>
        </div>
        <div className="flex gap-2">
          <ImportDialog>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </ImportDialog>
          <BookmarkForm>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Bookmark
            </Button>
          </BookmarkForm>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Get started by adding your first bookmark or importing from your browser
            </p>
            <div className="flex gap-2">
              <ImportDialog>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Bookmarks
                </Button>
              </ImportDialog>
              <BookmarkForm>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Bookmark
                </Button>
              </BookmarkForm>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{bookmarks.length} Bookmarks</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {bookmarks.filter(b => b.status === 'healthy').length} Healthy
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {bookmarks.filter(b => b.status === 'broken').length} Broken
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookmarks.map((bookmark) => (
                    <TableRow key={bookmark.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <a 
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              {bookmark.title || bookmark.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {bookmark.title && (
                            <div className="text-sm text-muted-foreground">
                              {bookmark.url}
                            </div>
                          )}
                          {bookmark.tags && bookmark.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {bookmark.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(bookmark.status)}
                          {bookmark.status_code && (
                            <div className="text-xs text-muted-foreground">
                              {bookmark.status_code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatResponseTime(bookmark.response_time)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {bookmark.last_checked ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(bookmark.last_checked).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {bookmark.category ? (
                          <Badge variant="outline">{bookmark.category}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <BookmarkForm bookmark={bookmark}>
                                <button className="w-full flex items-center">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </button>
                              </BookmarkForm>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                // Trigger health check
                                fetch(`/api/bookmarks/${bookmark.id}/check`, { method: 'POST' })
                                  .then(() => window.location.reload())
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Check Now
                            </DropdownMenuItem>
                            <Separator />
                            <DeleteDialog bookmarkId={bookmark.id}>
                              <button className="w-full flex items-center px-2 py-1.5 text-sm text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </DeleteDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
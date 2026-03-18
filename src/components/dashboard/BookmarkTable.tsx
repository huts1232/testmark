'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MoreHorizontal, 
  Search, 
  Filter,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

interface Bookmark {
  id: string
  title: string
  url: string
  category: string | null
  status: 'healthy' | 'unhealthy' | 'warning' | 'pending'
  last_checked: string | null
  response_time: number | null
  status_code: number | null
  created_at: string
}

interface BookmarkTableProps {
  bookmarks: Bookmark[]
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    label: 'Healthy',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  unhealthy: {
    icon: XCircle,
    label: 'Unhealthy',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  warning: {
    icon: AlertCircle,
    label: 'Warning',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

export default function BookmarkTable({ bookmarks, onEdit, onDelete }: BookmarkTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Get unique categories for filter
  const categories = Array.from(
    new Set(bookmarks.filter(b => b.category).map(b => b.category))
  ).sort()

  // Filter bookmarks based on search and filters
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || bookmark.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || bookmark.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const formatLastChecked = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return '1 day ago'
    
    return date.toLocaleDateString()
  }

  const formatResponseTime = (responseTime: number | null) => {
    if (!responseTime) return '-'
    return `${responseTime}ms`
  }

  const getStatusCode = (statusCode: number | null) => {
    if (!statusCode) return '-'
    return statusCode.toString()
  }

  if (bookmarks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No bookmarks yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first bookmark to start monitoring your important links
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="unhealthy">Unhealthy</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category || 'uncategorized'}>
                      {category || 'Uncategorized'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bookmark</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response Time</TableHead>
              <TableHead>Status Code</TableHead>
              <TableHead>Last Checked</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookmarks.map((bookmark) => {
              const StatusIcon = statusConfig[bookmark.status].icon
              
              return (
                <TableRow key={bookmark.id}>
                  <TableCell>
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {bookmark.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {bookmark.url}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="flex-shrink-0"
                      >
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {bookmark.category ? (
                      <Badge variant="outline" className="text-xs">
                        {bookmark.category}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${statusConfig[bookmark.status].color} border`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[bookmark.status].label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-sm text-gray-600">
                    {formatResponseTime(bookmark.response_time)}
                  </TableCell>
                  
                  <TableCell className="text-sm text-gray-600">
                    {getStatusCode(bookmark.status_code)}
                  </TableCell>
                  
                  <TableCell className="text-sm text-gray-600">
                    {formatLastChecked(bookmark.last_checked)}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onEdit(bookmark)}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(bookmark.id)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* No results */}
      {filteredBookmarks.length === 0 && bookmarks.length > 0 && (
        <div className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bookmarks found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setCategoryFilter('all')
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
      )}
      
      {/* Results count */}
      {filteredBookmarks.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
          Showing {filteredBookmarks.length} of {bookmarks.length} bookmarks
        </div>
      )}
    </Card>
  )
}
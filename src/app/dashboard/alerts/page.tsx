import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react'

interface Alert {
  id: string
  created_at: string
  type: 'bookmark_down' | 'bookmark_up' | 'bookmark_slow'
  title: string
  message: string
  read: boolean
  bookmark_id: string
  bookmark: {
    title: string
    url: string
  }
}

interface AlertStats {
  total: number
  unread: number
  today: number
}

async function getAlerts(userId: string): Promise<Alert[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .select(`
      *,
      bookmark:bookmarks(title, url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return data || []
}

async function getAlertStats(userId: string): Promise<AlertStats> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('alerts')
    .select('id, read, created_at')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching alert stats:', error)
    return { total: 0, unread: 0, today: 0 }
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAlerts = data?.filter(alert => 
    alert.created_at.startsWith(today)
  ).length || 0

  return {
    total: data?.length || 0,
    unread: data?.filter(alert => !alert.read).length || 0,
    today: todayAlerts
  }
}

function getAlertIcon(type: Alert['type']) {
  switch (type) {
    case 'bookmark_down':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'bookmark_up':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'bookmark_slow':
      return <Clock className="h-4 w-4 text-yellow-500" />
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />
  }
}

function getAlertBadgeColor(type: Alert['type']) {
  switch (type) {
    case 'bookmark_down':
      return 'destructive'
    case 'bookmark_up':
      return 'default'
    case 'bookmark_slow':
      return 'secondary'
    default:
      return 'outline'
  }
}

function formatAlertType(type: Alert['type']) {
  switch (type) {
    case 'bookmark_down':
      return 'Site Down'
    case 'bookmark_up':
      return 'Site Recovered'
    case 'bookmark_slow':
      return 'Slow Response'
    default:
      return 'Unknown'
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
}

export default async function AlertsPage() {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth')
  }

  const [alerts, stats] = await Promise.all([
    getAlerts(user.id),
    getAlertStats(user.id)
  ])

  const unresolvedAlerts = alerts.filter(alert => 
    alert.type === 'bookmark_down' || alert.type === 'bookmark_slow'
  )
  const resolvedAlerts = alerts.filter(alert => alert.type === 'bookmark_up')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and manage your bookmark alerts and notifications
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              Alerts today
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Alerts</TabsTrigger>
            <TabsTrigger value="unresolved">
              Unresolved
              {unresolvedAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unresolvedAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                className="pl-9 w-64"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bookmark_down">Site Down</SelectItem>
                <SelectItem value="bookmark_up">Site Recovered</SelectItem>
                <SelectItem value="bookmark_slow">Slow Response</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Alerts</CardTitle>
              <CardDescription>
                Complete history of all your bookmark alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    We'll notify you here when your bookmarks have issues or recover from problems.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Bookmark</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id} className={!alert.read ? 'bg-muted/50' : ''}>
                        <TableCell>
                          {getAlertIcon(alert.type)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getAlertBadgeColor(alert.type) as any}>
                            {formatAlertType(alert.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-48">
                              {alert.bookmark.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate max-w-48">
                              {alert.bookmark.url}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{alert.message}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(alert.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Mark as read
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unresolved">
          <Card>
            <CardHeader>
              <CardTitle>Unresolved Issues</CardTitle>
              <CardDescription>
                Bookmarks that are currently down or experiencing issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unresolvedAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All clear!</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    No unresolved issues with your bookmarks at the moment.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Bookmark</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unresolvedAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          {getAlertIcon(alert.type)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getAlertBadgeColor(alert.type) as any}>
                            {formatAlertType(alert.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-48">
                              {alert.bookmark.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate max-w-48">
                              {alert.bookmark.url}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{alert.message}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(alert.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Recheck Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Issues</CardTitle>
              <CardDescription>
                Bookmarks that have recovered from previous issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resolvedAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recoveries yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    When your bookmarks recover from issues, you'll see those notifications here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Bookmark</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Recovered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resolvedAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          {getAlertIcon(alert.type)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-48">
                              {alert.bookmark.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate max-w-48">
                              {alert.bookmark.url}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{alert.message}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(alert.created_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
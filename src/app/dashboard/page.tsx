import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Plus,
  RefreshCw,
  TrendingUp,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

interface BookmarkStats {
  total: number
  healthy: number
  broken: number
  pending: number
  lastChecked: string | null
}

interface RecentAlert {
  id: string
  bookmark_id: string
  bookmark_url: string
  bookmark_title: string
  status: 'error' | 'warning' | 'info'
  message: string
  created_at: string
}

interface HealthCheck {
  id: string
  bookmark_id: string
  status_code: number | null
  response_time: number | null
  error_message: string | null
  checked_at: string
  bookmark: {
    url: string
    title: string
  }
}

async function getBookmarkStats(): Promise<BookmarkStats> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth')
  }

  // Get bookmark counts by status
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      id,
      status,
      last_checked,
      health_checks!inner (
        id,
        status_code,
        checked_at
      )
    `)
    .eq('user_id', user.id)
    .order('last_checked', { ascending: false })

  if (!bookmarks) {
    return {
      total: 0,
      healthy: 0,
      broken: 0,
      pending: 0,
      lastChecked: null
    }
  }

  const stats = bookmarks.reduce(
    (acc, bookmark) => {
      acc.total++
      if (bookmark.status === 'healthy') acc.healthy++
      else if (bookmark.status === 'broken') acc.broken++
      else acc.pending++
      return acc
    },
    { total: 0, healthy: 0, broken: 0, pending: 0 }
  )

  const lastChecked = bookmarks.length > 0 && bookmarks[0].last_checked 
    ? bookmarks[0].last_checked 
    : null

  return {
    ...stats,
    lastChecked
  }
}

async function getRecentAlerts(): Promise<RecentAlert[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: alerts } = await supabase
    .from('alerts')
    .select(`
      id,
      bookmark_id,
      status,
      message,
      created_at,
      bookmarks!inner (
        url,
        title,
        user_id
      )
    `)
    .eq('bookmarks.user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!alerts) return []

  return alerts.map(alert => ({
    id: alert.id,
    bookmark_id: alert.bookmark_id,
    bookmark_url: (alert.bookmarks as any)?.[0]?.url ?? '',
    bookmark_title: (alert.bookmarks as any)?.[0]?.title ?? '',
    status: alert.status as 'error' | 'warning' | 'info',
    message: alert.message,
    created_at: alert.created_at
  }))
}

async function getRecentHealthChecks(): Promise<HealthCheck[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: healthChecks } = await supabase
    .from('health_checks')
    .select(`
      id,
      bookmark_id,
      status_code,
      response_time,
      error_message,
      checked_at,
      bookmarks!inner (
        url,
        title,
        user_id
      )
    `)
    .eq('bookmarks.user_id', user.id)
    .order('checked_at', { ascending: false })
    .limit(10)

  if (!healthChecks) return []

  return healthChecks.map(check => ({
    id: check.id,
    bookmark_id: check.bookmark_id,
    status_code: check.status_code,
    response_time: check.response_time,
    error_message: check.error_message,
    checked_at: check.checked_at,
    bookmark: {
      url: (check.bookmarks as any)?.[0]?.url ?? '',
      title: (check.bookmarks as any)?.[0]?.title ?? ''
    }
  }))
}

function StatsCards({ stats }: { stats: BookmarkStats }) {
  const healthPercentage = stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Monitoring {stats.total} bookmark{stats.total !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Healthy</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
          <p className="text-xs text-muted-foreground">
            {healthPercentage}% of total bookmarks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Broken</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.broken}</div>
          <p className="text-xs text-muted-foreground">
            Need immediate attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">
            Waiting for first check
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function HealthOverview({ stats }: { stats: BookmarkStats }) {
  const healthPercentage = stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Health Overview
        </CardTitle>
        <CardDescription>
          Overall health status of your monitored bookmarks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Health Score</span>
            <span className="font-medium">{healthPercentage}%</span>
          </div>
          <Progress 
            value={healthPercentage} 
            className="h-2"
          />
        </div>
        
        {stats.lastChecked && (
          <div className="text-sm text-muted-foreground">
            Last checked: {new Date(stats.lastChecked).toLocaleString()}
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard/bookmarks">
              <Plus className="mr-2 h-4 w-4" />
              Add Bookmark
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/api/bookmarks/check" target="_blank">
              <RefreshCw className="mr-2 h-4 w-4" />
              Check All
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentAlertsCard({ alerts }: { alerts: RecentAlert[] }) {
  const getAlertIcon = (status: string) => {
    switch (status) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertBadgeVariant = (status: string) => {
    switch (status) {
      case 'error':
        return 'destructive' as const
      case 'warning':
        return 'secondary' as const
      default:
        return 'default' as const
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alerts
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/alerts">
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardTitle>
        <CardDescription>
          Latest notifications about your bookmarks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
            No recent alerts. All bookmarks are healthy!
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                {getAlertIcon(alert.status)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium truncate">
                      {alert.bookmark_title}
                    </h4>
                    <Badge variant={getAlertBadgeVariant(alert.status)} className="ml-2">
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentActivityCard({ healthChecks }: { healthChecks: HealthCheck[] }) {
  const getStatusBadge = (statusCode: number | null, errorMessage: string | null) => {
    if (errorMessage) {
      return <Badge variant="destructive">Error</Badge>
    }
    if (!statusCode) {
      return <Badge variant="secondary">Pending</Badge>
    }
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
    }
    if (statusCode >= 400) {
      return <Badge variant="destructive">Broken</Badge>
    }
    return <Badge variant="secondary">Unknown</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/bookmarks">
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardTitle>
        <CardDescription>
          Latest health check results
        </CardDescription>
      </CardHeader>
      <CardContent>
        {healthChecks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 mb-2" />
            No recent activity. Add bookmarks to start monitoring!
          </div>
        ) : (
          <div className="space-y-4">
            {healthChecks.map((check) => (
              <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium truncate">
                      {check.bookmark.title}
                    </h4>
                    {getStatusBadge(check.status_code, check.error_message)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(check.checked_at).toLocaleString()}</span>
                    {check.response_time && (
                      <span>{check.response_time}ms</span>
                    )}
                    {check.status_code && (
                      <span>HTTP {check.status_code}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const [stats, alerts, healthChecks] = await Promise.all([
    getBookmarkStats(),
    getRecentAlerts(),
    getRecentHealthChecks()
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor the health of your bookmarked URLs at a glance
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <StatsCards stats={stats} />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-2">
        <Suspense fallback={<div>Loading health overview...</div>}>
          <HealthOverview stats={stats} />
        </Suspense>

        <Suspense fallback={<div>Loading recent alerts...</div>}>
          <RecentAlertsCard alerts={alerts} />
        </Suspense>
      </div>

      <Suspense fallback={<div>Loading recent activity...</div>}>
        <RecentActivityCard healthChecks={healthChecks} />
      </Suspense>

      {stats.total === 0 && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Welcome to TestMark! Get started by{' '}
            <Link 
              href="/dashboard/bookmarks" 
              className="font-medium underline underline-offset-4"
            >
              adding your first bookmark
            </Link>{' '}
            to begin monitoring.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
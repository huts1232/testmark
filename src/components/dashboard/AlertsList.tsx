'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle2, Clock, ExternalLink, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Alert {
  id: string
  bookmark_id: string
  bookmark_title: string
  bookmark_url: string
  alert_type: 'status_code' | 'timeout' | 'ssl' | 'dns'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: string
  status_code?: number
  response_time?: number
  is_resolved: boolean
  resolved_at?: string
  created_at: string
}

interface AlertsListProps {
  alerts: Alert[]
  onResolve: (id: string) => void
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getAlertTypeIcon = (type: string) => {
  switch (type) {
    case 'status_code':
      return <AlertCircle className="h-4 w-4" />
    case 'timeout':
      return <Clock className="h-4 w-4" />
    case 'ssl':
      return <AlertCircle className="h-4 w-4" />
    case 'dns':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

const getAlertTypeLabel = (type: string) => {
  switch (type) {
    case 'status_code':
      return 'HTTP Error'
    case 'timeout':
      return 'Timeout'
    case 'ssl':
      return 'SSL Issue'
    case 'dns':
      return 'DNS Issue'
    default:
      return 'Unknown'
  }
}

export default function AlertsList({ alerts, onResolve }: AlertsListProps) {
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set())

  const handleResolve = async (id: string) => {
    setResolvingIds(prev => new Set(prev).add(id))
    try {
      await onResolve(id)
    } finally {
      setResolvingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No alerts to show
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            All your bookmarks are healthy! When issues are detected, they'll appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  const unresolvedAlerts = alerts.filter(alert => !alert.is_resolved)
  const resolvedAlerts = alerts.filter(alert => alert.is_resolved)

  return (
    <div className="space-y-6">
      {/* Unresolved Alerts */}
      {unresolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Active Alerts ({unresolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unresolvedAlerts.map((alert) => (
              <Alert key={alert.id} className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertTypeIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">
                        {getAlertTypeLabel(alert.alert_type)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(alert.created_at))} ago
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {alert.bookmark_title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{alert.bookmark_url}</span>
                    </div>
                    <AlertDescription className="text-gray-700 mb-2">
                      {alert.message}
                    </AlertDescription>
                    {alert.details && (
                      <details className="text-sm text-gray-600 mb-3">
                        <summary className="cursor-pointer hover:text-gray-800">
                          View details
                        </summary>
                        <pre className="mt-2 bg-gray-50 p-2 rounded text-xs whitespace-pre-wrap">
                          {alert.details}
                        </pre>
                      </details>
                    )}
                    {(alert.status_code || alert.response_time) && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {alert.status_code && (
                          <span>Status: {alert.status_code}</span>
                        )}
                        {alert.response_time && (
                          <span>Response Time: {alert.response_time}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolvingIds.has(alert.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {resolvingIds.has(alert.id) ? (
                        <>
                          <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-2" />
                          Resolving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-2" />
                          Mark Resolved
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="h-5 w-5" />
              Resolved Alerts ({resolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolvedAlerts.map((alert, index) => (
              <div key={alert.id}>
                <div className="flex items-start gap-3 opacity-75">
                  <div className="flex-shrink-0 mt-0.5 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Resolved
                      </Badge>
                      <Badge variant="secondary" className="opacity-75">
                        {getAlertTypeLabel(alert.alert_type)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Resolved {formatDistanceToNow(new Date(alert.resolved_at || alert.created_at))} ago
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      {alert.bookmark_title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                </div>
                {index < resolvedAlerts.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
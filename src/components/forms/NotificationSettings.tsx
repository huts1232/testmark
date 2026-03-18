'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Mail, Smartphone, Clock, AlertTriangle } from 'lucide-react'

export interface NotificationSettings {
  id?: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  alert_threshold: number
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  digest_enabled: boolean
  digest_frequency: 'daily' | 'weekly' | 'monthly'
  created_at?: string
  updated_at?: string
}

interface NotificationSettingsFormProps {
  settings: NotificationSettings
  onSave: (settings: NotificationSettings) => void
}

export default function NotificationSettings({ settings, onSave }: NotificationSettingsFormProps) {
  const [formData, setFormData] = useState<NotificationSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive alerts when bookmarks break
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-notifications" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={formData.email_notifications}
              onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push-notifications" className="text-sm font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Browser push notifications
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={formData.push_notifications}
              onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms-notifications" className="text-sm font-medium">
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Text message alerts (premium feature)
                </p>
              </div>
            </div>
            <Switch
              id="sms-notifications"
              checked={formData.sms_notifications}
              onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Notification Timing
          </CardTitle>
          <CardDescription>
            Control when and how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="notification-frequency">Notification Frequency</Label>
            <Select
              value={formData.notification_frequency}
              onValueChange={(value) => updateSetting('notification_frequency', value as NotificationSettings['notification_frequency'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Summary</SelectItem>
                <SelectItem value="daily">Daily Summary</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours" className="text-sm font-medium">
                Quiet Hours
              </Label>
              <p className="text-sm text-muted-foreground">
                Pause notifications during specific hours
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={formData.quiet_hours_enabled}
              onCheckedChange={(checked) => updateSetting('quiet_hours_enabled', checked)}
            />
          </div>

          {formData.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <input
                  type="time"
                  id="quiet-start"
                  value={formData.quiet_hours_start}
                  onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <input
                  type="time"
                  id="quiet-end"
                  value={formData.quiet_hours_end}
                  onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Sensitivity
          </CardTitle>
          <CardDescription>
            Configure when to trigger alerts based on failure patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="alert-threshold">
              Alert Threshold (consecutive failures)
            </Label>
            <Select
              value={formData.alert_threshold.toString()}
              onValueChange={(value) => updateSetting('alert_threshold', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 failure (most sensitive)</SelectItem>
                <SelectItem value="2">2 failures</SelectItem>
                <SelectItem value="3">3 failures (recommended)</SelectItem>
                <SelectItem value="5">5 failures</SelectItem>
                <SelectItem value="10">10 failures (least sensitive)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Number of consecutive failures before triggering an alert
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="digest-enabled" className="text-sm font-medium">
                Health Digest
              </Label>
              <p className="text-sm text-muted-foreground">
                Regular summary of all bookmark statuses
              </p>
            </div>
            <Switch
              id="digest-enabled"
              checked={formData.digest_enabled}
              onCheckedChange={(checked) => updateSetting('digest_enabled', checked)}
            />
          </div>

          {formData.digest_enabled && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label htmlFor="digest-frequency">Digest Frequency</Label>
              <Select
                value={formData.digest_frequency}
                onValueChange={(value) => updateSetting('digest_frequency', value as NotificationSettings['digest_frequency'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Changes to notification settings take effect immediately. Make sure to test your 
          notification channels to ensure you receive alerts properly.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
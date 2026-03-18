'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { User, Bell, Mail, Smartphone, Shield, Trash2 } from 'lucide-react'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

type NotificationSettings = {
  id: string
  user_id: string
  email_enabled: boolean
  email_frequency: 'immediate' | 'hourly' | 'daily'
  webhook_enabled: boolean
  webhook_url: string | null
  alert_types: string[]
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('Not authenticated')

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Get notification settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError
      }

      if (settingsData) {
        setSettings(settingsData)
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          user_id: user.id,
          email_enabled: true,
          email_frequency: 'immediate' as const,
          webhook_enabled: false,
          webhook_url: null,
          alert_types: ['bookmark_down', 'bookmark_slow', 'bookmark_recovered']
        }

        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (createError) throw createError
        setSettings(newSettings)
      }
    } catch (err) {
      console.error('Error loading user data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
      toast.success('Profile updated successfully')
    } catch (err) {
      console.error('Error updating profile:', err)
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    if (!settings) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('id', settings.id)

      if (error) throw error

      setSettings({ ...settings, ...updates })
      toast.success('Settings updated successfully')
    } catch (err) {
      console.error('Error updating settings:', err)
      const message = err instanceof Error ? err.message : 'Failed to update settings'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const toggleAlertType = (alertType: string) => {
    if (!settings) return

    const currentTypes = settings.alert_types || []
    const newTypes = currentTypes.includes(alertType)
      ? currentTypes.filter(type => type !== alertType)
      : [...currentTypes, alertType]

    updateSettings({ alert_types: newTypes })
  }

  const deleteAccount = async () => {
    if (!profile) return
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will remove all your bookmarks and data.'
    )
    
    if (!confirmed) return

    try {
      setSaving(true)
      setError(null)

      // Delete user data through API
      const response = await fetch('/api/settings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to delete account')
      }

      toast.success('Account deleted successfully')
      
      // Sign out and redirect
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      console.error('Error deleting account:', err)
      const message = err instanceof Error ? err.message : 'Failed to delete account'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!profile || !settings) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load settings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and notification preferences
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            <Button 
              onClick={() => updateProfile({ full_name: profile.full_name })}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how and when you want to be notified about bookmark issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.email_enabled}
                  onCheckedChange={(checked) => updateSettings({ email_enabled: checked })}
                />
              </div>

              {settings.email_enabled && (
                <div className="ml-6 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Frequency</label>
                    <Select
                      value={settings.email_frequency}
                      onValueChange={(value: 'immediate' | 'hourly' | 'daily') => 
                        updateSettings({ email_frequency: value })
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Summary</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Webhook Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Webhook Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Send alerts to a webhook URL
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.webhook_enabled}
                  onCheckedChange={(checked) => updateSettings({ webhook_enabled: checked })}
                />
              </div>

              {settings.webhook_enabled && (
                <div className="ml-6 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Webhook URL</label>
                    <Input
                      type="url"
                      value={settings.webhook_url || ''}
                      onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                      placeholder="https://your-webhook-url.com"
                      onBlur={() => updateSettings({ webhook_url: settings.webhook_url })}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll send POST requests with alert data to this URL
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Alert Types */}
            <div className="space-y-4">
              <div>
                <p className="font-medium">Alert Types</p>
                <p className="text-sm text-muted-foreground">
                  Choose which types of alerts you want to receive
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'bookmark_down', label: 'Bookmark Down', desc: 'When a bookmark becomes unreachable' },
                  { key: 'bookmark_slow', label: 'Slow Response', desc: 'When a bookmark takes too long to respond' },
                  { key: 'bookmark_recovered', label: 'Bookmark Recovered', desc: 'When a bookmark comes back online' },
                  { key: 'ssl_expiring', label: 'SSL Expiring', desc: 'When SSL certificates are about to expire' },
                ].map((alertType) => (
                  <div key={alertType.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{alertType.label}</p>
                      <p className="text-sm text-muted-foreground">{alertType.desc}</p>
                    </div>
                    <Switch
                      checked={settings.alert_types?.includes(alertType.key) || false}
                      onCheckedChange={() => toggleAlertType(alertType.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Management
            </CardTitle>
            <CardDescription>
              Manage your account security and data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <p className="font-medium text-destructive">Danger Zone</p>
                <p className="text-sm text-muted-foreground">
                  Irreversible and destructive actions
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <p className="font-medium text-red-800">Delete Account</p>
                  <p className="text-sm text-red-600">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteAccount}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {saving ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
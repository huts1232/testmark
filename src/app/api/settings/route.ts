import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Get notification settings
    const { data: notificationSettings, error: notificationError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (notificationError && notificationError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch notification settings' },
        { status: 500 }
      )
    }

    // Default notification settings if none exist
    const defaultNotifications = {
      email_enabled: true,
      email_frequency: 'immediate',
      alert_types: ['down', 'slow', 'error'],
      digest_frequency: 'daily',
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'UTC'
    }

    const settings = {
      profile: {
        full_name: profile.full_name,
        email: user.email,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at
      },
      notifications: notificationSettings || defaultNotifications,
      preferences: {
        check_frequency: profile.check_frequency || 300, // 5 minutes default
        timeout_seconds: profile.timeout_seconds || 30,
        max_redirects: profile.max_redirects || 5,
        user_agent: profile.user_agent || 'TestMark Bot/1.0'
      }
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { profile, notifications, preferences } = body

    // Validate required fields
    if (!profile && !notifications && !preferences) {
      return NextResponse.json(
        { error: 'At least one settings section is required' },
        { status: 400 }
      )
    }

    // Update profile if provided
    if (profile) {
      const allowedProfileFields = ['full_name', 'avatar_url']
      const profileUpdates = Object.keys(profile)
        .filter(key => allowedProfileFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = profile[key]
          return obj
        }, {} as any)

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            ...profileUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (profileError) {
          console.error('Profile update error:', profileError)
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          )
        }
      }
    }

    // Update preferences if provided
    if (preferences) {
      const allowedPreferenceFields = [
        'check_frequency',
        'timeout_seconds',
        'max_redirects',
        'user_agent'
      ]
      
      const preferenceUpdates = Object.keys(preferences)
        .filter(key => allowedPreferenceFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = preferences[key]
          return obj
        }, {} as any)

      // Validate preference values
      if (preferenceUpdates.check_frequency !== undefined) {
        const freq = parseInt(preferenceUpdates.check_frequency)
        if (isNaN(freq) || freq < 60 || freq > 86400) {
          return NextResponse.json(
            { error: 'Check frequency must be between 60 and 86400 seconds' },
            { status: 400 }
          )
        }
        preferenceUpdates.check_frequency = freq
      }

      if (preferenceUpdates.timeout_seconds !== undefined) {
        const timeout = parseInt(preferenceUpdates.timeout_seconds)
        if (isNaN(timeout) || timeout < 5 || timeout > 300) {
          return NextResponse.json(
            { error: 'Timeout must be between 5 and 300 seconds' },
            { status: 400 }
          )
        }
        preferenceUpdates.timeout_seconds = timeout
      }

      if (preferenceUpdates.max_redirects !== undefined) {
        const redirects = parseInt(preferenceUpdates.max_redirects)
        if (isNaN(redirects) || redirects < 0 || redirects > 20) {
          return NextResponse.json(
            { error: 'Max redirects must be between 0 and 20' },
            { status: 400 }
          )
        }
        preferenceUpdates.max_redirects = redirects
      }

      if (Object.keys(preferenceUpdates).length > 0) {
        const { error: preferencesError } = await supabase
          .from('profiles')
          .update({
            ...preferenceUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (preferencesError) {
          console.error('Preferences update error:', preferencesError)
          return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
          )
        }
      }
    }

    // Update notification settings if provided
    if (notifications) {
      const allowedNotificationFields = [
        'email_enabled',
        'email_frequency',
        'alert_types',
        'digest_frequency',
        'quiet_hours_enabled',
        'quiet_hours_start',
        'quiet_hours_end',
        'timezone'
      ]

      const notificationUpdates = Object.keys(notifications)
        .filter(key => allowedNotificationFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = notifications[key]
          return obj
        }, {} as any)

      // Validate notification settings
      if (notificationUpdates.email_frequency !== undefined) {
        const validFrequencies = ['immediate', 'hourly', 'daily', 'never']
        if (!validFrequencies.includes(notificationUpdates.email_frequency)) {
          return NextResponse.json(
            { error: 'Invalid email frequency' },
            { status: 400 }
          )
        }
      }

      if (notificationUpdates.digest_frequency !== undefined) {
        const validDigestFreqs = ['daily', 'weekly', 'never']
        if (!validDigestFreqs.includes(notificationUpdates.digest_frequency)) {
          return NextResponse.json(
            { error: 'Invalid digest frequency' },
            { status: 400 }
          )
        }
      }

      if (notificationUpdates.alert_types !== undefined) {
        const validAlertTypes = ['down', 'slow', 'error', 'recovered']
        const isValidAlertTypes = Array.isArray(notificationUpdates.alert_types) &&
          notificationUpdates.alert_types.every((type: string) => validAlertTypes.includes(type))
        
        if (!isValidAlertTypes) {
          return NextResponse.json(
            { error: 'Invalid alert types' },
            { status: 400 }
          )
        }
      }

      if (Object.keys(notificationUpdates).length > 0) {
        // Check if notification settings exist
        const { data: existingSettings } = await supabase
          .from('notification_settings')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (existingSettings) {
          // Update existing settings
          const { error: notificationError } = await supabase
            .from('notification_settings')
            .update({
              ...notificationUpdates,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)

          if (notificationError) {
            console.error('Notification settings update error:', notificationError)
            return NextResponse.json(
              { error: 'Failed to update notification settings' },
              { status: 500 }
            )
          }
        } else {
          // Create new settings
          const { error: notificationError } = await supabase
            .from('notification_settings')
            .insert({
              user_id: user.id,
              ...notificationUpdates,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (notificationError) {
            console.error('Notification settings create error:', notificationError)
            return NextResponse.json(
              { error: 'Failed to create notification settings' },
              { status: 500 }
            )
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
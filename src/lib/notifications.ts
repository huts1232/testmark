import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface NotificationData {
  bookmarkId: string
  bookmarkTitle: string
  bookmarkUrl: string
  status: 'down' | 'slow' | 'up'
  responseTime?: number
  statusCode?: number
  error?: string
  checkedAt: string
  userId: string
  userEmail: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface WebhookPayload {
  event: 'bookmark.down' | 'bookmark.slow' | 'bookmark.up'
  timestamp: string
  data: {
    bookmark: {
      id: string
      title: string
      url: string
    }
    health_check: {
      status: string
      response_time?: number
      status_code?: number
      error?: string
      checked_at: string
    }
    user: {
      id: string
      email: string
    }
  }
}

// Email notification service
export class EmailNotificationService {
  private apiKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || ''
    this.fromEmail = process.env.FROM_EMAIL || 'notifications@testmark.dev'
  }

  /**
   * Send email notification using Resend API
   */
  async sendNotification(
    to: string,
    template: EmailTemplate
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      console.error('RESEND_API_KEY is not configured')
      return { success: false, error: 'Email service not configured' }
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Email sending failed:', errorData)
        return { success: false, error: errorData.message || 'Failed to send email' }
      }

      const data = await response.json()
      console.log('Email sent successfully:', data.id)
      return { success: true }
    } catch (error) {
      console.error('Email sending error:', error)
      return { success: false, error: 'Network error while sending email' }
    }
  }

  /**
   * Generate email template for bookmark status change
   */
  generateBookmarkStatusTemplate(notification: NotificationData): EmailTemplate {
    const { bookmarkTitle, bookmarkUrl, status, responseTime, statusCode, error, checkedAt } = notification
    
    const statusEmoji = {
      down: '🔴',
      slow: '🟡',
      up: '🟢'
    }

    const statusText = {
      down: 'is DOWN',
      slow: 'is SLOW',
      up: 'is UP'
    }

    const subject = `${statusEmoji[status]} ${bookmarkTitle} ${statusText[status]}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; border-left: 4px solid ${status === 'down' ? '#ef4444' : status === 'slow' ? '#f59e0b' : '#10b981'};">
            <h1 style="margin: 0 0 20px 0; color: ${status === 'down' ? '#dc2626' : status === 'slow' ? '#d97706' : '#059669'};">
              ${statusEmoji[status]} Bookmark ${statusText[status]}
            </h1>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px;">${bookmarkTitle}</h2>
              <p style="margin: 5px 0; color: #6b7280;">
                <strong>URL:</strong> <a href="${bookmarkUrl}" style="color: #3b82f6; text-decoration: none;">${bookmarkUrl}</a>
              </p>
              <p style="margin: 5px 0; color: #6b7280;">
                <strong>Status:</strong> ${status.toUpperCase()}
              </p>
              ${responseTime ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Response Time:</strong> ${responseTime}ms</p>` : ''}
              ${statusCode ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Status Code:</strong> ${statusCode}</p>` : ''}
              ${error ? `<p style="margin: 5px 0; color: #dc2626;"><strong>Error:</strong> ${error}</p>` : ''}
              <p style="margin: 5px 0; color: #6b7280;">
                <strong>Checked:</strong> ${new Date(checkedAt).toLocaleString()}
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                You're receiving this because you have notifications enabled for this bookmark.
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #3b82f6; text-decoration: none;">Manage notification settings</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      ${statusEmoji[status]} Bookmark ${statusText[status]}
      
      ${bookmarkTitle}
      URL: ${bookmarkUrl}
      Status: ${status.toUpperCase()}
      ${responseTime ? `Response Time: ${responseTime}ms` : ''}
      ${statusCode ? `Status Code: ${statusCode}` : ''}
      ${error ? `Error: ${error}` : ''}
      Checked: ${new Date(checkedAt).toLocaleString()}
      
      You're receiving this because you have notifications enabled for this bookmark.
      Manage settings: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings
    `

    return { subject, html, text }
  }
}

// Webhook notification service
export class WebhookNotificationService {
  /**
   * Send webhook notification to configured URL
   */
  async sendNotification(
    webhookUrl: string,
    payload: WebhookPayload,
    secret?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'TestMark/1.0',
      }

      // Add signature if secret is provided
      if (secret) {
        const signature = await this.generateSignature(JSON.stringify(payload), secret)
        headers['X-TestMark-Signature'] = signature
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status} ${response.statusText}`)
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }

      console.log('Webhook sent successfully:', webhookUrl)
      return { success: true }
    } catch (error) {
      console.error('Webhook sending error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Generate webhook payload for bookmark status change
   */
  generateBookmarkStatusPayload(notification: NotificationData): WebhookPayload {
    const eventMap = {
      down: 'bookmark.down' as const,
      slow: 'bookmark.slow' as const,
      up: 'bookmark.up' as const
    }

    return {
      event: eventMap[notification.status],
      timestamp: new Date().toISOString(),
      data: {
        bookmark: {
          id: notification.bookmarkId,
          title: notification.bookmarkTitle,
          url: notification.bookmarkUrl
        },
        health_check: {
          status: notification.status,
          response_time: notification.responseTime,
          status_code: notification.statusCode,
          error: notification.error,
          checked_at: notification.checkedAt
        },
        user: {
          id: notification.userId,
          email: notification.userEmail
        }
      }
    }
  }

  /**
   * Generate HMAC SHA256 signature for webhook payload
   */
  private async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(payload)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const hashArray = Array.from(new Uint8Array(signature))
    return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

// Main notification service that handles both email and webhook notifications
export class NotificationService {
  private emailService: EmailNotificationService
  private webhookService: WebhookNotificationService

  constructor() {
    this.emailService = new EmailNotificationService()
    this.webhookService = new WebhookNotificationService()
  }

  /**
   * Send notifications for bookmark status changes based on user preferences
   */
  async sendBookmarkStatusNotification(notification: NotificationData): Promise<void> {
    try {
      // Get user's notification settings
      const { data: settings } = await supabaseAdmin
        .from('notification_settings')
        .select('*')
        .eq('user_id', notification.userId)
        .single()

      if (!settings) {
        console.log(`No notification settings found for user ${notification.userId}`)
        return
      }

      const promises: Promise<any>[] = []

      // Send email notification if enabled
      if (settings.email_enabled) {
        const shouldNotify = this.shouldSendEmailNotification(notification.status, settings)
        
        if (shouldNotify) {
          console.log(`Sending email notification to ${notification.userEmail}`)
          const template = this.emailService.generateBookmarkStatusTemplate(notification)
          promises.push(
            this.emailService.sendNotification(notification.userEmail, template)
              .then(result => {
                if (!result.success) {
                  console.error('Email notification failed:', result.error)
                }
                return result
              })
          )
        }
      }

      // Send webhook notification if configured
      if (settings.webhook_enabled && settings.webhook_url) {
        const shouldNotify = this.shouldSendWebhookNotification(notification.status, settings)
        
        if (shouldNotify) {
          console.log(`Sending webhook notification to ${settings.webhook_url}`)
          const payload = this.webhookService.generateBookmarkStatusPayload(notification)
          promises.push(
            this.webhookService.sendNotification(
              settings.webhook_url,
              payload,
              settings.webhook_secret
            ).then(result => {
              if (!result.success) {
                console.error('Webhook notification failed:', result.error)
              }
              return result
            })
          )
        }
      }

      // Wait for all notifications to complete
      if (promises.length > 0) {
        await Promise.allSettled(promises)
      }

      console.log(`Notification processing completed for bookmark ${notification.bookmarkId}`)
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  /**
   * Determine if email notification should be sent based on status and settings
   */
  private shouldSendEmailNotification(status: string, settings: any): boolean {
    switch (status) {
      case 'down':
        return settings.email_on_down
      case 'slow':
        return settings.email_on_slow
      case 'up':
        return settings.email_on_recovery
      default:
        return false
    }
  }

  /**
   * Determine if webhook notification should be sent based on status and settings
   */
  private shouldSendWebhookNotification(status: string, settings: any): boolean {
    switch (status) {
      case 'down':
        return settings.webhook_on_down
      case 'slow':
        return settings.webhook_on_slow
      case 'up':
        return settings.webhook_on_recovery
      default:
        return false
    }
  }

  /**
   * Create alert record in database
   */
  async createAlert(notification: NotificationData): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('alerts')
        .insert({
          user_id: notification.userId,
          bookmark_id: notification.bookmarkId,
          type: notification.status,
          title: `${notification.bookmarkTitle} is ${notification.status}`,
          message: this.generateAlertMessage(notification),
          created_at: new Date().toISOString(),
          read: false
        })

      if (error) {
        console.error('Error creating alert:', error)
      } else {
        console.log(`Alert created for bookmark ${notification.bookmarkId}`)
      }
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  /**
   * Generate alert message based on notification data
   */
  private generateAlertMessage(notification: NotificationData): string {
    const { bookmarkUrl, status, responseTime, statusCode, error, checkedAt } = notification
    
    let message = `URL: ${bookmarkUrl}\n`
    message += `Status: ${status.toUpperCase()}\n`
    
    if (responseTime) {
      message += `Response Time: ${responseTime}ms\n`
    }
    
    if (statusCode) {
      message += `Status Code: ${statusCode}\n`
    }
    
    if (error) {
      message += `Error: ${error}\n`
    }
    
    message += `Checked: ${new Date(checkedAt).toLocaleString()}`
    
    return message
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
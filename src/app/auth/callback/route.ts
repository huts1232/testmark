import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error.message)
        return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
      }

      if (data.user) {
        // Check if user profile exists, create if it doesn't
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || null,
              avatar_url: data.user.user_metadata?.avatar_url || null,
              plan: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('Profile creation error:', insertError.message)
            // Continue anyway - profile creation failure shouldn't block auth
          } else {
            // Create default notification settings for new user
            await supabase
              .from('notification_settings')
              .insert({
                user_id: data.user.id,
                email_enabled: true,
                webhook_enabled: false,
                webhook_url: null,
                alert_frequency: 'immediate',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .catch((err) => {
                console.error('Notification settings creation error:', err.message)
              })
          }
        } else if (profileError) {
          console.error('Profile check error:', profileError.message)
        }
      }

      // Successful authentication - redirect to dashboard or next page
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth?error=server_error`)
    }
  }

  // No code parameter provided
  return NextResponse.redirect(`${origin}/auth?error=no_code_provided`)
}
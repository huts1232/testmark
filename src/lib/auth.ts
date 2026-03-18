import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { cache } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side Supabase client for server components and API routes
export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
})

// Server-side Supabase client for middleware
export const createMiddlewareSupabaseClient = (request: NextRequest) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        const response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
        return response
      },
      remove(name: string, options: any) {
        const response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: '',
          ...options,
        })
        return response
      },
    },
  })
}

// Client-side Supabase client for client components
export const createClientSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Get the current user on the server
export const getUser = cache(async () => {
  const supabase = await createServerSupabaseClient()
  
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error in getUser:', error)
    return null
  }
})

// Get the user's profile from the profiles table
export const getProfile = cache(async () => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createServerSupabaseClient()

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error in getProfile:', error)
    return null
  }
})

// Check if user is authenticated (for use in server components)
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getUser()
  return !!user
}

// Sign out helper
export const signOut = async () => {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      return { error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in signOut:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Type definitions for auth-related data
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan_type: 'free' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  updated_at: string
}

// Helper to create or update user profile after sign up/sign in
export const upsertProfile = async (user: AuthUser) => {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.email?.split('@')[0] || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in upsertProfile:', error)
    return null
  }
}

// Helper to check if user has required permissions
export const hasPermission = async (requiredPlan: 'free' | 'pro' | 'enterprise'): Promise<boolean> => {
  const profile = await getProfile()
  if (!profile) return false

  const planHierarchy = { free: 0, pro: 1, enterprise: 2 }
  const userPlanLevel = planHierarchy[profile.plan_type]
  const requiredPlanLevel = planHierarchy[requiredPlan]

  return userPlanLevel >= requiredPlanLevel
}

// Helper to get user's bookmark count (for plan limits)
export const getUserBookmarkCount = cache(async (): Promise<number> => {
  const user = await getUser()
  if (!user) return 0

  const supabase = await createServerSupabaseClient()

  try {
    const { count, error } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching bookmark count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getUserBookmarkCount:', error)
    return 0
  }
})

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    bookmarks: 25,
    checks_per_day: 100,
    features: ['basic_monitoring', 'email_alerts']
  },
  pro: {
    bookmarks: 500,
    checks_per_day: 2000,
    features: ['basic_monitoring', 'email_alerts', 'webhook_alerts', 'custom_intervals', 'bulk_import']
  },
  enterprise: {
    bookmarks: -1, // unlimited
    checks_per_day: -1, // unlimited
    features: ['basic_monitoring', 'email_alerts', 'webhook_alerts', 'custom_intervals', 'bulk_import', 'priority_support', 'custom_domains']
  }
} as const
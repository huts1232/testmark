import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  BookmarkIcon, 
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Get alert counts for navigation badges
  const { count: alertCount } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('status', 'unread')

  const { count: bookmarkCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  const navigationItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: ChartBarIcon,
      current: false,
    },
    {
      name: 'Bookmarks',
      href: '/dashboard/bookmarks',
      icon: BookmarkIcon,
      current: false,
      badge: bookmarkCount || 0,
    },
    {
      name: 'Alerts',
      href: '/dashboard/alerts',
      icon: ExclamationTriangleIcon,
      current: false,
      badge: alertCount || 0,
      badgeColor: alertCount ? 'bg-red-500' : 'bg-gray-500',
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Cog6ToothIcon,
      current: false,
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCardIcon,
      current: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookmarkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TestMark</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 group"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded-full ${item.badgeColor || 'bg-blue-500'}`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <Separator />

          {/* User Profile */}
          <div className="p-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-blue-500 text-white text-sm">
                  {session.user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || session.user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            
            <form action="/auth/signout" method="post" className="mt-2">
              <Button 
                type="submit" 
                variant="ghost" 
                className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="py-8 px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
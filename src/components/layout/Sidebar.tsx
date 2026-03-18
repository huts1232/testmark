'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  BookmarkIcon,
  HomeIcon,
  AlertTriangleIcon,
  SettingsIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TestTubeIcon,
  BellIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentPath: string
  isCollapsed?: boolean
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export function Sidebar({ currentPath, isCollapsed: externalIsCollapsed }: SidebarProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  const pathname = usePathname()
  
  // Use external collapsed state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Bookmarks',
      href: '/dashboard/bookmarks',
      icon: BookmarkIcon,
    },
    {
      name: 'Health Checks',
      href: '/dashboard/health-checks',
      icon: TestTubeIcon,
    },
    {
      name: 'Alerts',
      href: '/dashboard/alerts',
      icon: AlertTriangleIcon,
      badge: 3, // This would come from actual alert count
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: SettingsIcon,
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCardIcon,
    },
  ]

  const toggleCollapsed = () => {
    if (externalIsCollapsed === undefined) {
      setInternalIsCollapsed(!internalIsCollapsed)
    }
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TestTubeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">TestMark</span>
          </div>
        )}
        
        {externalIsCollapsed === undefined && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              'p-1.5 h-auto',
              isCollapsed && 'mx-auto'
            )}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start h-10 px-3',
                  isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                  isCollapsed && 'px-0 justify-center'
                )}
              >
                <item.icon className={cn(
                  'w-4 h-4',
                  !isCollapsed && 'mr-3',
                  isActive && 'text-blue-700'
                )} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge 
                        variant={isActive ? 'default' : 'secondary'}
                        className={cn(
                          'ml-auto text-xs',
                          isActive && 'bg-blue-600 text-white'
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 font-medium">
              QUICK ACTIONS
            </div>
            <Button size="sm" className="w-full justify-start" variant="outline">
              <BellIcon className="w-4 h-4 mr-2" />
              Test All Links
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="w-full p-2">
            <BellIcon className="w-4 h-4" />
          </Button>
        )}
        
        {!isCollapsed && (
          <>
            <Separator className="my-3" />
            <div className="text-xs text-gray-400 text-center">
              © 2024 TestMark
            </div>
          </>
        )}
      </div>
    </div>
  )
}
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Bell, 
  Home, 
  Package, 
  Store, 
  Users, 
  Settings, 
  ClipboardCheck, 
  Flag, 
  UploadCloud 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const pathname = usePathname() || ''

  const mainNavItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      iconColor: 'text-blue-500',
      isExact: true,
    },
    {
      label: 'ETL Engine',
      href: '/dashboard/upload',
      icon: UploadCloud,
      iconColor: 'text-violet-500 dark:text-violet-400',
      isExact: false,
    },
    {
      label: 'Audits',
      href: '/dashboard/audits',
      icon: ClipboardCheck,
      iconColor: 'text-emerald-500',
      isExact: false,
    },
    {
      label: 'Findings',
      href: '/dashboard/findings',
      icon: Flag,
      iconColor: 'text-rose-500',
      isExact: false,
    },
    {
      label: 'Clients',
      href: '/dashboard/clients',
      icon: Users,
      iconColor: 'text-blue-500',
      isExact: false,
    },
    {
      label: 'Brands',
      href: '/dashboard/brands',
      icon: Package,
      iconColor: 'text-amber-500',
      isExact: false,
    },
    {
      label: 'Stores',
      href: '/dashboard/stores',
      icon: Store,
      iconColor: 'text-purple-500',
      isExact: false,
    },
  ]

  const isItemActive = (href: string, isExact?: boolean) => {
    if (isExact || href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const isSettingsActive = pathname.startsWith('/dashboard/settings')

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 my-4 ml-4 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl p-4 justify-between transition-all duration-300 print:hidden z-30">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-2">
          <Link href="/" className="flex items-center gap-3 font-extrabold text-xl tracking-tight text-gray-900 dark:text-white group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-900 dark:bg-primary text-white dark:text-primary-foreground shadow-lg dark:shadow-primary/20 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <Package className="h-6 w-6" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Audit OS</span>
          </Link>
          <Button variant="outline" size="icon" className="ml-auto h-9 w-9 rounded-xl border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </div>

        {/* Navigation List */}
        <div className="px-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-3 px-3">Main Navigation</p>
          <nav className="grid gap-1.5 text-sm font-semibold">
            {mainNavItems.map((item) => {
              const active = isItemActive(item.href, item.isExact)
              const IconComponent = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                    active
                      ? 'bg-gray-900 text-white dark:bg-primary dark:text-primary-foreground font-black shadow-lg shadow-gray-900/10 dark:shadow-primary/20 scale-[1.01]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white font-bold hover:translate-x-1'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 ${active ? 'text-white dark:text-primary-foreground' : item.iconColor}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      
      {/* System Navigation Bottom */}
      <div className="px-1 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-2 px-3">System</p>
        <Link
          href="/dashboard/settings/organization"
          className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
            isSettingsActive
              ? 'bg-gray-900 text-white dark:bg-primary dark:text-primary-foreground font-black shadow-lg shadow-gray-900/10 dark:shadow-primary/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
          }`}
        >
          <Settings className={`h-5 w-5 ${isSettingsActive ? 'text-white dark:text-primary-foreground' : 'text-slate-400'}`} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}

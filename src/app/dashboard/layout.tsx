import { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Bell, CircleUser, Home, Package, Store, Users, LogOut, Settings, ClipboardCheck, Flag, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OrganizationSwitcher } from '@/components/shared/organization-switcher'
import { getOrganizations } from '@/server/actions/organizations'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const organizations = await getOrganizations()

  if (organizations.length === 0) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen w-full flex bg-muted/20 print:flex print:flex-col print:w-full">
      {/* Dynamic Client Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area with Floating Topbar */}
      <div className="flex flex-col flex-1 min-w-0 print:block print:w-full">
        <header className="sticky top-4 z-40 mx-4 md:mx-6 flex h-16 items-center gap-4 rounded-2xl border border-border/60 bg-background/85 backdrop-blur-xl px-6 shadow-xl shadow-black/5 transition-all duration-300 print:hidden mt-4">
          <div className="w-full flex-1">
            <OrganizationSwitcher organizations={organizations} />
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-10 w-10 rounded-2xl border border-border/60 shadow-md hover:scale-105 transition-all duration-200">
                <CircleUser className="h-6 w-6 text-foreground/80" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-border/80">
              <DropdownMenuLabel className="font-extrabold text-sm px-3 py-2">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="rounded-xl px-3 py-2 font-medium cursor-pointer transition-colors">Settings</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 font-medium cursor-pointer transition-colors">Support</DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 font-medium cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors">
                <form action="/api/auth/logout" method="post" className="w-full">
                  <button type="submit" className="w-full flex items-center gap-2.5 font-bold">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 print:p-0 print:m-0 print:w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

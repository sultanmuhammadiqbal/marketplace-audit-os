import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { getRecentActivity, getNeedsAttention } from '@/server/actions/analytics'
import { DashboardAnalytics } from '@/components/dashboard/dashboard-analytics'
import { InjectDemoDataButton } from '@/components/dashboard/inject-demo-data-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organizations
  const { getOrganizations } = await import('@/server/actions/organizations')
  const orgs = await getOrganizations()
  const activeOrgId = orgs && orgs.length > 0 ? orgs[0].id : null

  if (!activeOrgId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 space-y-4">
        <h1 className="text-3xl font-bold">Welcome to Marketplace Audit OS</h1>
        <p className="text-gray-600">Please create or join an organization to view the dashboard.</p>
      </div>
    )
  }

  const [recentActivity, needsAttention] = await Promise.all([
    getRecentActivity(activeOrgId),
    getNeedsAttention(activeOrgId)
  ])

  return (
    <div className="flex-1 space-y-8">
      {/* Page Header with Prominent Demo Injection Trigger */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Overview</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Live financial advertising metrics & operational audit pulse.</p>
        </div>
        <div className="flex items-center gap-3">
          <InjectDemoDataButton organizationId={activeOrgId} />
        </div>
      </div>
      
      {/* ETL Analytics & KPI Visualization Engine */}
      <DashboardAnalytics organizationId={activeOrgId} />

      {/* Activity & Attention Feeds */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-4 rounded-3xl border-border/80 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-xl font-extrabold tracking-tight">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 text-sm font-semibold text-muted-foreground/80">No recent activity found.</div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3.5 rounded-2xl border border-transparent hover:border-border/60 hover:bg-muted/50 hover:shadow-sm hover:translate-x-1 transition-all duration-200 cursor-pointer group">
                    <div className="flex-shrink-0">
                      {activity.type === 'audit' ? (
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{activity.title}</p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="ml-auto font-extrabold flex-shrink-0">
                      {activity.type === 'audit' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-base">{activity.score ? `${activity.score}%` : 'N/A'}</span>
                      ) : (
                        <span className={`text-xs px-3 py-1.5 font-bold uppercase tracking-wider rounded-xl border ${activity.severity === 'Critical' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'}`}>
                          {activity.severity}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 rounded-3xl border-border/80 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-extrabold tracking-tight">Needs Attention</CardTitle>
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 animate-pulse" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {needsAttention.length === 0 ? (
                <div className="text-center py-12 text-sm font-semibold text-muted-foreground/80">All clear! No critical issues found.</div>
              ) : (
                needsAttention.map((finding) => (
                  <div key={finding.id} className="flex items-center gap-4 p-3.5 rounded-2xl border border-rose-500/10 bg-rose-500/5 hover:border-rose-500/30 hover:shadow-md hover:translate-x-1 transition-all duration-200 cursor-pointer group">
                    <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:rotate-12 transition-transform duration-200 flex-shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{finding.title}</p>
                      <p className="text-xs font-semibold text-muted-foreground truncate">
                        {(finding.audit as any)?.store?.name || 'Unknown Store'}
                      </p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                       <span className={`text-xs px-3 py-1.5 font-bold uppercase tracking-wider rounded-xl border ${finding.severity === 'Critical' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 font-extrabold animate-pulse' : 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30'}`}>
                          {finding.severity}
                        </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

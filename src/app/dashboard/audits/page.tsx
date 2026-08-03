import { getAudits } from '@/server/actions/audits'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { PlusIcon } from 'lucide-react'

export default async function AuditsDashboardPage() {
  const audits = await getAudits()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Audit Sessions</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage, execute, and review comprehensive evaluation reports across your stores.</p>
        </div>
        <Link href="/dashboard/audits/new">
          <Button size="lg" className="rounded-2xl px-6 font-extrabold shadow-xl hover:scale-105 transition-all duration-200">
            <PlusIcon className="mr-2 h-5 w-5 stroke-[3]" /> Start New Audit
          </Button>
        </Link>
      </div>

      <Card className="rounded-3xl border-border/80 shadow-2xl overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/40 px-6 py-5">
          <CardTitle className="text-xl font-extrabold tracking-tight">Audit Logs</CardTitle>
          <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Historical inspection trail across connected channels</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Store</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Auditor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started On</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-40 text-muted-foreground font-semibold">
                    No audits initiated yet. Click &quot;Start New Audit&quot; to launch your first session!
                  </TableCell>
                </TableRow>
              ) : (
                audits.map((audit: any) => (
                  <TableRow key={audit.id} className="group cursor-pointer">
                    <TableCell className="font-extrabold text-foreground group-hover:text-primary transition-colors">{audit.store?.name || 'Untitled Store'}</TableCell>
                    <TableCell className="font-semibold text-muted-foreground">{audit.template?.name || 'Standard Audit'}</TableCell>
                    <TableCell className="font-medium text-muted-foreground/90">{audit.auditor?.first_name} {audit.auditor?.last_name}</TableCell>
                    <TableCell>
                      {audit.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                          In Progress
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground text-xs">{new Date(audit.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                    <TableCell className="text-right">
                      <Link href={audit.status === 'completed' ? `/dashboard/audits/${audit.id}/summary` : `/dashboard/audits/${audit.id}/checklist`}>
                        <Button variant={audit.status === 'completed' ? 'outline' : 'default'} size="sm" className="rounded-xl font-bold px-4 transition-all group-hover:shadow-md">
                          {audit.status === 'completed' ? 'Scorecard' : 'Continue'}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

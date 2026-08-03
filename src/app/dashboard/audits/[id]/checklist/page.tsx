import { getAuditChecklist } from '@/server/actions/audits'
import { ChecklistClient } from './checklist-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Store, Calendar, Activity } from 'lucide-react'

export default async function AuditChecklistPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const auditData = await getAuditChecklist(resolvedParams.id)
  const statusLabel = auditData.audit.status === 'completed' ? 'Selesai Evaluasi' : 'Sedang Audit (In Progress)'
  const statusColor = auditData.audit.status === 'completed' 
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'

  return (
    <div className="space-y-6">
      {/* Top Analytical Dashboard Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/audits">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shadow-2xs hover:bg-muted transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <Store className="h-6 w-6 text-primary" />
                <span>{auditData.audit.store?.name || 'Toko Marketplace'}</span>
              </h1>
              <Badge variant="outline" className={`font-medium text-xs px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs ${statusColor}`}>
                {statusLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary/70" />
                Template: {auditData.audit.template?.name || 'Audit Marketplace'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary/70" />
                Tanggal Audit: {new Date(auditData.audit.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <ChecklistClient auditData={auditData} />
    </div>
  )
}

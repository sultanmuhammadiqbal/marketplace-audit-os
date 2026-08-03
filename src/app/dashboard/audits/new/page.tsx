import { getStores } from '@/server/actions/stores'
import { getAuditTemplates } from '@/server/actions/audits'
import { getOrganizations } from '@/server/actions/organizations'
import { NewAuditForm } from './new-audit-form'

export default async function NewAuditPage() {
  const organizations = await getOrganizations()
  const orgId = organizations[0]?.id

  let stores: any[] = []
  let templates: any[] = []

  if (orgId) {
    stores = await getStores(orgId)
    templates = await getAuditTemplates(orgId)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Audit</h1>
        <p className="text-muted-foreground mt-1">Configure and start a new audit session.</p>
      </div>
      
      <NewAuditForm 
        stores={stores} 
        templates={templates} 
        organizations={organizations} 
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAudit } from '@/server/actions/audits'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export function NewAuditForm({
  stores,
  templates,
  organizations
}: {
  stores: any[]
  templates: any[]
  organizations: any[]
}) {
  const router = useRouter()
  const [storeId, setStoreId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default to the first organization for MVP
  const organizationId = organizations[0]?.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!storeId || !templateId || !organizationId) {
      toast.error('Please select a store and an audit template.')
      return
    }

    setIsSubmitting(true)
    try {
      const auditId = await createAudit(storeId, templateId, organizationId)
      toast.success('Audit started successfully!')
      router.push(`/dashboard/audits/${auditId}/checklist`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to start audit')
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Start New Audit</CardTitle>
        <CardDescription>Select a store and an audit template to begin a new audit session.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="store">Store</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger id="store">
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name} ({store.platform})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Audit Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !storeId || !templateId}>
            {isSubmitting ? 'Starting...' : 'Start Audit'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

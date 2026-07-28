import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientAction } from '@/server/actions/clients'
import { getOrganizations } from '@/server/actions/organizations'

export default async function NewClientPage() {
  const organizations = await getOrganizations()
  const activeOrg = organizations[0]

  if (!activeOrg) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Client</h1>
        <p className="text-muted-foreground">You must create an organization first.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add New Client</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Enter the details of the client you are auditing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createClientAction} className="grid gap-4">
              <input type="hidden" name="organizationId" value={activeOrg.id} />
              <div className="grid gap-2">
                <Label htmlFor="name">Client Name</Label>
                <Input id="name" name="name" placeholder="Acme Corp" required />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save Client</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

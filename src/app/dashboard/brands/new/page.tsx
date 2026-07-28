import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createBrandAction } from '@/server/actions/brands'
import { getOrganizations } from '@/server/actions/organizations'
import { getClients } from '@/server/actions/clients'

export default async function NewBrandPage() {
  const organizations = await getOrganizations()
  const activeOrg = organizations[0]

  if (!activeOrg) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Brand</h1>
        <p className="text-muted-foreground">You must create an organization first.</p>
      </div>
    )
  }

  const clients = await getClients(activeOrg.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/brands">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add New Brand</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Brand Details</CardTitle>
            <CardDescription>
              Enter the details of the brand and optionally assign it to a client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBrandAction} className="grid gap-4">
              <input type="hidden" name="organizationId" value={activeOrg.id} />
              
              <div className="grid gap-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input id="name" name="name" placeholder="Super Shoes" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientId">Client (Optional)</Label>
                <Select name="clientId">
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end mt-4">
                <Button type="submit">Save Brand</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

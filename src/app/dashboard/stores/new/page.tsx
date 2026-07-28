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
import { createStoreAction } from '@/server/actions/stores'
import { getOrganizations } from '@/server/actions/organizations'
import { getClients } from '@/server/actions/clients'
import { getBrands } from '@/server/actions/brands'

export default async function NewStorePage() {
  const organizations = await getOrganizations()
  const activeOrg = organizations[0]

  if (!activeOrg) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Store</h1>
        <p className="text-muted-foreground">You must create an organization first.</p>
      </div>
    )
  }

  const clients = await getClients(activeOrg.id)
  const brands = await getBrands(activeOrg.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stores">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add New Store</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
            <CardDescription>
              Connect a marketplace store to a client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createStoreAction} className="grid gap-6">
              <input type="hidden" name="organizationId" value={activeOrg.id} />
              
              <div className="grid gap-2">
                <Label htmlFor="name">Store Name</Label>
                <Input id="name" name="name" placeholder="Super Shoes Official" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="platform">Platform</Label>
                <Select name="platform" required>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Select a platform..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopee">Shopee</SelectItem>
                    <SelectItem value="tiktok_shop">TikTok Shop</SelectItem>
                    <SelectItem value="lazada">Lazada</SelectItem>
                    <SelectItem value="tokopedia">Tokopedia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientId">Client</Label>
                  <Select name="clientId" required>
                    <SelectTrigger id="clientId">
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                      {clients.length === 0 && (
                        <SelectItem value="disabled" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="brandId">Brand (Optional)</Label>
                  <Select name="brandId">
                    <SelectTrigger id="brandId">
                      <SelectValue placeholder="Select a brand..." />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                      {brands.length === 0 && (
                        <SelectItem value="none" disabled>
                          No brands available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="storeUrl">Store URL (Optional)</Label>
                <Input id="storeUrl" name="storeUrl" type="url" placeholder="https://shopee.com/supershoes" />
              </div>

              <div className="flex justify-end mt-4">
                <Button type="submit">Save Store</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

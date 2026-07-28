import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { getOrganizations } from '@/server/actions/organizations'

export default async function OrganizationSettingsPage() {
  const organizations = await getOrganizations()
  const activeOrg = organizations[0]

  if (!activeOrg) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">You must create an organization first.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization details and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your organization&apos;s core details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" defaultValue={activeOrg.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="id">Organization ID</Label>
              <Input id="id" defaultValue={activeOrg.id} disabled className="bg-muted text-muted-foreground" />
              <p className="text-[0.8rem] text-muted-foreground">
                This is your unique organization identifier.
              </p>
            </div>
            <div className="flex justify-end mt-4">
              {/* In a real app, this would be wired to an update action */}
              <Button type="button" disabled>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

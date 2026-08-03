import { createOrganization } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function getDisplayError(err: unknown): string | null {
  if (!err) return null
  if (typeof err === 'string') {
    const trimmed = err.trim()
    if (trimmed === '{}' || trimmed === '[object Object]' || trimmed === 'undefined' || !trimmed) {
      return 'Workspace setup failed. Please check the organization details and try again.'
    }
    return trimmed
  }
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>
    if (typeof obj.message === 'string' && obj.message && obj.message !== '{}' && obj.message !== '[object Object]') {
      return obj.message
    }
    if (typeof obj.error_description === 'string' && obj.error_description && obj.error_description !== '{}') {
      return obj.error_description
    }
    if (typeof obj.error === 'string' && obj.error && obj.error !== '{}') {
      return obj.error
    }
  }
  return 'Workspace setup failed. Please check the organization details and try again.'
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const displayError = getDisplayError(params.error)

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md border border-border/80 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Marketplace Audit OS</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Let&apos;s set up your workspace by creating your first organization.
          </CardDescription>
        </CardHeader>
        <form action={createOrganization}>
          <CardContent className="space-y-4">
            {displayError && (
              <div className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 border border-red-200 p-3.5 rounded-xl text-sm font-medium leading-relaxed">
                {displayError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-xs font-semibold uppercase tracking-wider">Organization Name</Label>
              <Input id="orgName" name="orgName" placeholder="Acme Agency" required className="h-11 rounded-xl" />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button className="w-full h-11 rounded-xl font-semibold text-sm shadow-md transition-all" type="submit">
              Create Organization
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

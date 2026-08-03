import Link from 'next/link'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function getDisplayError(err: unknown): string | null {
  if (!err) return null
  if (typeof err === 'string') {
    const trimmed = err.trim()
    if (trimmed === '{}' || trimmed === '[object Object]' || trimmed === 'undefined' || !trimmed) {
      return 'Sign in failed. Please verify your email and password and try again.'
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
  return 'Sign in failed. Please verify your email and password and try again.'
}

export default async function LoginPage({
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
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <form action={login}>
          <CardContent className="space-y-4">
            {displayError && (
              <div className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 border border-red-200 p-3.5 rounded-xl text-sm font-medium leading-relaxed">
                {displayError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">Password</Label>
              </div>
              <Input id="password" name="password" type="password" required className="h-11 rounded-xl" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button className="w-full h-11 rounded-xl font-semibold text-sm shadow-md transition-all" type="submit">
              Sign In
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

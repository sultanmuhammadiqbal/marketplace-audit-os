'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected authentication error occurred. Please try again.'
  
  // If it's already a string, verify it's not '{}' or empty
  if (typeof error === 'string') {
    const trimmed = error.trim()
    if (trimmed === '{}' || trimmed === '[object Object]' || trimmed === 'undefined' || !trimmed) {
      return 'Authentication failed. Please check your credentials and try again.'
    }
    return trimmed
  }
  
  // If it's an object or Error instance, extract the message property cleanly
  if (typeof error === 'object') {
    if (error.message && typeof error.message === 'string' && error.message !== '{}' && error.message !== '[object Object]') {
      return error.message
    }
    if (error.error_description && typeof error.error_description === 'string' && error.error_description !== '{}') {
      return error.error_description
    }
    if (error.error && typeof error.error === 'string' && error.error !== '{}') {
      return error.error
    }
    if (error.code && typeof error.code === 'string') {
      if (error.code === 'user_already_exists' || error.code === 'user_exists') {
        return 'This email address is already registered. Please sign in instead.'
      }
      return `Authentication failed (${error.code}).`
    }
    
    // Fallback for custom Error instances without non-enumerable serialization issues
    if (error instanceof Error) {
      const str = error.toString()
      if (str && str !== 'Error' && str !== '[object Object]' && str !== '{}') {
        return str
      }
    }
  }
  
  return 'Authentication failed. Please check your credentials and try again.'
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(getAuthErrorMessage(error))}`)
  }

  // Check if user has an organization
  const { data: userData } = await supabase.auth.getUser()
  if (userData?.user) {
    const { data: orgs } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', userData.user.id)
      .limit(1)

    if (!orgs || orgs.length === 0) {
      redirect('/onboarding')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rawName = (formData.get('fullName') || `${formData.get('firstName') || ''} ${formData.get('lastName') || ''}`) as string
  const fullName = rawName ? rawName.toString().trim() : 'User'

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(getAuthErrorMessage(error))}`)
  }

  // Handle Supabase email enumeration protection: when email is already taken, error is null but identities array is empty
  if (authData?.user?.identities && authData.user.identities.length === 0) {
    redirect(`/signup?error=${encodeURIComponent('This email address is already registered. Please sign in instead.')}`)
  }

  // Insert into public.profiles using Admin Client (bypasses RLS)
  if (authData?.user) {
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ') || ''

    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    redirect('/login')
  }

  const orgName = formData.get('orgName') as string

  // 0. Ensure Profile Exists
  const fullName = userData.user.user_metadata?.full_name || userData.user.email || 'User'
  const nameParts = fullName.split(' ')
  const firstName = nameParts[0] || 'User'
  const lastName = nameParts.slice(1).join(' ') || ''

  await adminClient.from('profiles').upsert({
    id: userData.user.id,
    first_name: firstName,
    last_name: lastName,
  }, { onConflict: 'id' })

  // 1. Create Organization (bypassing RLS)
  const { data: orgData, error: orgError } = await adminClient
    .from('organizations')
    .insert({ name: orgName })
    .select()
    .single()

  if (orgError || !orgData) {
    console.error('Supabase Org Insert Error:', orgError)
    redirect(`/onboarding?error=${encodeURIComponent(getAuthErrorMessage(orgError) || 'Failed to create organization')}`)
  }

  // 2. Fetch or create 'organization_owner' role
  let { data: roleData, error: roleError } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', 'organization_owner')
    .single()

  if (roleError || !roleData || !roleData.id) {
    // Role doesn't exist, create it
    const { data: newRole, error: newRoleError } = await adminClient
      .from('roles')
      .insert({ name: 'organization_owner', description: 'Owner of the organization' })
      .select()
      .single()
      
    if (newRoleError || !newRole) {
       redirect(`/onboarding?error=${encodeURIComponent('Failed to setup roles')}`)
    }
    roleData = newRole
  }

  // 3. Create Organization Membership for the user as owner
  const { error: membershipError } = await adminClient
    .from('organization_memberships')
    .insert({
      organization_id: orgData.id,
      user_id: userData.user.id,
      role_id: roleData!.id,
    })

  if (membershipError) {
    console.error('Supabase Membership Insert Error:', membershipError)
    redirect(`/onboarding?error=${encodeURIComponent(getAuthErrorMessage(membershipError) || 'Failed to join organization')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

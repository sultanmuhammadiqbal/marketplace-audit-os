'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createOrganization(formData: FormData) {
  const name = formData.get('name') as string

  if (!name) {
    throw new Error('Organization name is required')
  }

  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Unauthorized')
  }

  // 1. Check if user profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userData.user.id)
    .single()

  if (!profile) {
    throw new Error('User profile not found. Please complete your registration.')
  }

  // 2. Fetch the organization_owner role ID or create it
  let { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'organization_owner')
    .single()

  if (roleError || !role) {
    const { data: newRole, error: newRoleError } = await supabase
      .from('roles')
      .insert({ name: 'organization_owner', description: 'Owner of the organization' })
      .select('id')
      .single()
      
    if (newRoleError || !newRole) {
      console.error('Failed to create role:', newRoleError)
      throw new Error('Failed to initialize organization roles. Please contact support.')
    }
    role = newRole
  }

  // 3. Insert organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name })
    .select('id')
    .single()

  if (orgError || !org) {
    console.error('Failed to create organization:', orgError)
    throw new Error(`Failed to create organization: ${orgError?.message || 'Unknown error'}`)
  }

  // 4. Insert membership
  const { error: memberError } = await supabase
    .from('organization_memberships')
    .insert({
      organization_id: org.id,
      user_id: userData.user.id,
      role_id: role.id,
    })

  if (memberError) {
    console.error('Failed to create membership:', memberError)
    throw new Error(`Failed to add user to organization: ${memberError.message}`)
  }

  revalidatePath('/', 'layout')
}

export async function getOrganizations() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // The RLS policy restricts this to organizations the user is a member of
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch organizations:', error.message)
    return []
  }

  return organizations || []
}

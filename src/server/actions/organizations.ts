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

  // 1. Insert organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name })
    .select()
    .single()

  if (orgError || !org) {
    console.error('Failed to create organization:', orgError)
    throw new Error('Failed to create organization')
  }

  // 2. Fetch the organization_owner role ID
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'organization_owner')
    .single()

  if (roleError || !role) {
    console.error('Failed to fetch role:', roleError)
    // We should ideally rollback the org creation here, but we lack RPC for transaction in this MVP.
    throw new Error('Failed to assign owner role')
  }

  // 3. Insert membership
  const { error: memberError } = await supabase
    .from('organization_memberships')
    .insert({
      organization_id: org.id,
      user_id: userData.user.id,
      role_id: role.id,
    })

  if (memberError) {
    console.error('Failed to create membership:', memberError)
    throw new Error('Failed to add user to organization')
  }

  revalidatePath('/', 'layout')
}

export async function getOrganizations() {
  const supabase = await createClient()

  // The RLS policy restricts this to organizations the user is a member of
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch organizations:', error)
    return []
  }

  return organizations || []
}

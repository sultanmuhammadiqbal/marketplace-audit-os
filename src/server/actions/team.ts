'use server'

import { createClient } from '@/lib/supabase/server'

export async function getTeamMembers(organizationId: string) {
  const supabase = await createClient()

  // Verify the user is authenticated
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return []
  }

  // Fetch organization memberships joined with profiles and roles
  const { data: members, error } = await supabase
    .from('organization_memberships')
    .select(`
      id,
      user_id,
      created_at,
      profiles:user_id (
        first_name,
        last_name,
        avatar_url
      ),
      roles (
        name,
        description
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch team members:', error)
    return []
  }

  return members || []
}

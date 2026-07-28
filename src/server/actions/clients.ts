'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createClientAction(formData: FormData) {
  const name = formData.get('name') as string
  const organizationId = formData.get('organizationId') as string

  if (!name || !organizationId) {
    throw new Error('Name and Organization ID are required')
  }

  const supabase = await createClient()

  // Verify the user is authenticated
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Unauthorized')
  }

  // Note: RLS policies will automatically block the insert if the user is not
  // an organization_admin or organization_owner for the specified organizationId.

  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert({
      name,
      organization_id: organizationId,
    })
    .select()
    .single()

  if (clientError || !newClient) {
    console.error('Failed to create client:', clientError)
    throw new Error('Failed to create client. You may lack permission.')
  }

  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}

export async function getClients(organizationId: string) {
  const supabase = await createClient()

  // RLS will ensure they can only read clients for organizations they are members of
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch clients:', error)
    return []
  }

  return clients || []
}

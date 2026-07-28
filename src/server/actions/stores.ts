'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createStoreAction(formData: FormData) {
  const name = formData.get('name') as string
  const organizationId = formData.get('organizationId') as string
  const clientId = formData.get('clientId') as string
  const brandId = formData.get('brandId') as string | null
  const platform = formData.get('platform') as string

  if (!name || !organizationId || !clientId || !platform) {
    throw new Error('Name, Organization, Client, and Platform are required')
  }

  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Unauthorized')
  }

  const { data: newStore, error: storeError } = await supabase
    .from('stores')
    .insert({
      name,
      organization_id: organizationId,
      client_id: clientId,
      brand_id: brandId || null,
      platform,
    })
    .select()
    .single()

  if (storeError || !newStore) {
    console.error('Failed to create store:', storeError)
    throw new Error('Failed to create store. You may lack permission.')
  }

  revalidatePath('/dashboard/stores')
  redirect('/dashboard/stores')
}

export async function getStores(organizationId: string) {
  const supabase = await createClient()

  const { data: stores, error } = await supabase
    .from('stores')
    .select(`
      *,
      clients ( name ),
      brands ( name )
    `)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch stores:', error)
    return []
  }

  return stores || []
}

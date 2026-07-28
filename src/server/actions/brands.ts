'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBrandAction(formData: FormData) {
  const name = formData.get('name') as string
  const organizationId = formData.get('organizationId') as string
  const clientId = formData.get('clientId') as string | null

  if (!name || !organizationId) {
    throw new Error('Name and Organization ID are required')
  }

  const supabase = await createClient()

  // Verify the user is authenticated
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Unauthorized')
  }

  const { data: newBrand, error: brandError } = await supabase
    .from('brands')
    .insert({
      name,
      organization_id: organizationId,
      client_id: clientId || null,
    })
    .select()
    .single()

  if (brandError || !newBrand) {
    console.error('Failed to create brand:', brandError)
    throw new Error('Failed to create brand. You may lack permission.')
  }

  revalidatePath('/dashboard/brands')
  redirect('/dashboard/brands')
}

export async function getBrands(organizationId: string) {
  const supabase = await createClient()

  const { data: brands, error } = await supabase
    .from('brands')
    .select(`
      *,
      clients ( name )
    `)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch brands:', error)
    return []
  }

  return brands || []
}

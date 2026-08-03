'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFinding(data: {
  organization_id: string
  audit_id: string
  audit_question_id?: string
  title: string
  description?: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
}) {
  const supabase = await createClient()

  // Validate ownership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', data.organization_id)
    .single()

  if (!membership) {
    throw new Error('Unauthorized: You do not have access to this organization')
  }

  const { data: finding, error } = await supabase
    .from('findings')
    .insert([data])
    .select()
    .single()

  if (error) {
    console.error('Error creating finding:', error)
    throw new Error('Failed to create finding')
  }

  revalidatePath('/dashboard/findings')
  return finding
}

export async function getFindings() {
  const supabase = await createClient()

  const { data: findings, error } = await supabase
    .from('findings')
    .select(`
      *,
      audit:audits (
        id,
        store:stores(name)
      ),
      question:audit_questions (
        question_text
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching findings:', error)
    throw new Error('Failed to fetch findings')
  }

  return findings
}

export async function getFindingsByAudit(auditId: string) {
  const supabase = await createClient()

  const { data: findings, error } = await supabase
    .from('findings')
    .select(`
      *,
      question:audit_questions (
        question_text
      )
    `)
    .eq('audit_id', auditId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching findings for audit:', error)
    throw new Error('Failed to fetch findings for audit')
  }

  return findings || []
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Fetch available audit templates
 * Optionally scoped to an organization ID if we want, but currently RLS handles visibility.
 */
export async function getAuditTemplates(organizationId?: string) {
  const supabase = await createClient()
  
  let query = supabase.from('audit_templates').select('*')
  
  // If we only want templates specific to an org (and global ones)
  if (organizationId) {
    query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('Failed to fetch audit templates', error)
    return []
  }
  
  return data
}

/**
 * Fetch all audits for the user's organizations
 */
export async function getAudits() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('audits')
    .select(`
      id,
      status,
      created_at,
      completed_at,
      store:stores (name),
      template:audit_templates (name),
      auditor:profiles (first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch audits', error)
    return []
  }

  return data
}

/**
 * Create a new Audit session for a given store using a template
 */
export async function createAudit(storeId: string, templateId: string, organizationId: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase.from('audits').insert({
    organization_id: organizationId,
    store_id: storeId,
    template_id: templateId,
    auditor_id: userData.user.id,
    status: 'in_progress',
  }).select().single()

  if (error || !data) {
    console.error('Failed to create audit', error)
    throw new Error('Could not create audit session')
  }

  revalidatePath('/dashboard/audits')
  return data.id
}

/**
 * Fetch the checklist questions for an active Audit
 * Since Supabase JS has great support for nested querying via foreign keys,
 * we can fetch the Template -> Modules -> Questions and join with Answers.
 */
export async function getAuditChecklist(auditId: string) {
  const supabase = await createClient()

  // First fetch the audit to get the template_id
  const { data: audit, error: auditError } = await supabase
    .from('audits')
    .select('*, store:stores(name)')
    .eq('id', auditId)
    .single()

  if (auditError || !audit) {
    console.error('getAuditChecklist Error:', auditError, 'AuditID:', auditId)
    throw new Error('Audit not found')
  }

  // Fetch modules and questions for this template
  // And fetch existing answers for this audit
  // Note: We type assert here because generated types might not have these nested structures defined exactly if not updated yet.
  const { data: modulesData, error: modulesError } = await supabase
    .from('audit_template_modules')
    .select(`
      *,
      questions:audit_questions(*)
    `)
    .eq('template_id', audit.template_id)
    .order('order_index')

  if (modulesError) {
    throw new Error('Failed to load modules')
  }

  const { data: answersData, error: answersError } = await supabase
    .from('audit_answers')
    .select('*')
    .eq('audit_id', auditId)

  if (answersError) {
    throw new Error('Failed to load answers')
  }

  return {
    audit,
    modules: modulesData,
    answers: answersData || []
  }
}

/**
 * Save or Update an answer for a specific question in an audit
 */
export async function saveAuditAnswer(auditId: string, questionId: string, answerValue: string, notes?: string) {
  const supabase = await createClient()

  // Use UPSERT (insert with on conflict update)
  const { error } = await supabase.from('audit_answers').upsert(
    {
      audit_id: auditId,
      question_id: questionId,
      answer_value: answerValue,
      notes: notes || null,
    },
    { onConflict: 'audit_id,question_id' }
  )

  if (error) {
    console.error('Failed to save answer', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Complete the audit session
 */
export async function completeAudit(auditId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('audits')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', auditId)

  if (error) {
    console.error('Failed to complete audit', error)
    throw new Error('Could not complete audit')
  }

  revalidatePath('/dashboard/audits')
}

/**
 * Calculate scores and complete the audit session
 */
export async function calculateAndCompleteAudit(auditId: string) {
  const supabase = await createClient()

  // 1. Fetch Audit Checklist data
  const auditData = await getAuditChecklist(auditId)
  if (!auditData || !auditData.audit) {
    throw new Error('Audit not found')
  }

  const { audit, modules, answers } = auditData

  let totalEarned = 0
  let totalMax = 0
  const moduleResultsToInsert = []

  // 2. Calculate scores per module
  for (const module of modules) {
    let modEarned = 0
    let modMax = 0

    for (const question of module.questions || []) {
      if (question.question_type === 'text') continue // skip text questions for scoring

      const answer = answers.find((a: any) => a.question_id === question.id)
      if (!answer || !answer.answer_value) {
        if (question.question_type === 'pass_fail') modMax += 1
        if (question.question_type === 'scale') modMax += 5
        continue
      }

      if (question.question_type === 'pass_fail') {
        modMax += 1
        if (answer.answer_value === 'pass') modEarned += 1
      } else if (question.question_type === 'scale') {
        modMax += 5
        const val = parseInt(answer.answer_value, 10)
        if (!isNaN(val)) {
          modEarned += val
        }
      }
    }

    const percentage = modMax > 0 ? (modEarned / modMax) * 100 : 0

    moduleResultsToInsert.push({
      audit_id: audit.id,
      module_id: module.id,
      earned_score: modEarned,
      max_score: modMax,
      percentage_score: percentage
    })

    totalEarned += modEarned
    totalMax += modMax
  }

  // 3. Save module results
  if (moduleResultsToInsert.length > 0) {
    // Clean up existing results in case of retries
    await supabase.from('audit_module_results').delete().eq('audit_id', audit.id)

    const { error: insertError } = await supabase.from('audit_module_results').insert(moduleResultsToInsert)
    if (insertError) {
      console.error('Failed to save module results', insertError)
      throw new Error('Failed to save module results')
    }
  }

  // 4. Calculate overall score and update audit
  const overallScore = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0

  const { error: updateError } = await supabase
    .from('audits')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString(),
      overall_score: overallScore
    })
    .eq('id', audit.id)

  if (updateError) {
    console.error('Failed to complete audit with score', updateError)
    throw new Error('Could not complete audit')
  }

  revalidatePath('/dashboard/audits')
  return { success: true, auditId: audit.id }
}

/**
 * Fetch the audit summary including module scores
 */
export async function getAuditSummary(auditId: string) {
  const supabase = await createClient()

  const { data: audit, error: auditError } = await supabase
    .from('audits')
    .select('*, store:stores(name), template:audit_templates(name)')
    .eq('id', auditId)
    .single()

  if (auditError || !audit) {
    throw new Error('Audit not found')
  }

  const { data: moduleResults, error: resultsError } = await supabase
    .from('audit_module_results')
    .select('*, module:audit_template_modules(name)')
    .eq('audit_id', auditId)
    .order('percentage_score', { ascending: false })

  if (resultsError) {
    throw new Error('Failed to load module results')
  }

  return {
    audit,
    moduleResults: moduleResults || []
  }
}


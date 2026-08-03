'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export interface NormalizedEtlRow {
  originalName: string
  masterProductId?: string
  date: string
  spend: number
  views: number
  clicks: number
  orders: number
  revenue: number
}

export interface MasterProduct {
  id: string
  master_name: string
}

export interface EtlUploadResult {
  status: 'REQUIRES_MAPPING' | 'SUCCESS'
  unrecognizedProducts?: string[]
  normalizedRows?: NormalizedEtlRow[]
  summary?: {
    rowsProcessed: number
    uploadCount: number
  }
}

export interface MappingResolutionItem {
  originalName: string
  targetMasterIdOrName: string
  isNewMaster: boolean
}

/**
 * Helper to clean currency symbols, formatting dots/commas and convert to number
 */
function parseNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const str = String(val)
    .replace(/[Rp$\s,]/gi, '') // strip currency, spaces, commas
    .replace(/\.(?=\d{3})/g, '') // remove thousand separators if formatted like Indonesian numbers
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

/**
 * Helper to normalize date string to YYYY-MM-DD
 */
function parseDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0]
  if (typeof val === 'number') {
    // Handle Excel serial dates
    const date = XLSX.SSF.parse_date_code(val)
    if (date) {
      const y = date.y
      const m = String(date.m).padStart(2, '0')
      const d = String(date.d).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }
  const parsed = new Date(String(val))
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}

/**
 * Extract field value from a row object based on regex matching key headers
 */
function extractField(row: Record<string, any>, regex: RegExp): any {
  for (const key of Object.keys(row)) {
    if (regex.test(key.trim())) {
      return row[key]
    }
  }
  return undefined
}

export async function getOrganizationUploadStatus(organizationId: string) {
  const supabase = await createClient()
  const { data: org, error } = await supabase
    .from('organizations')
    .select('upload_count, name')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    throw new Error('Organization not found or access denied.')
  }

  return {
    uploadCount: org.upload_count || 0,
    limit: 3,
    isLimitReached: (org.upload_count || 0) >= 3,
    organizationName: org.name
  }
}

export async function getMasterProducts(organizationId: string): Promise<MasterProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('master_products')
    .select('id, master_name')
    .eq('organization_id', organizationId)
    .order('master_name', { ascending: true })

  if (error) {
    console.error('Failed to fetch master products:', error.message)
    return []
  }
  return data || []
}

export async function processEtlUpload(formData: FormData): Promise<EtlUploadResult> {
  const file = formData.get('file') as File
  const platform = formData.get('platform') as 'Shopee' | 'TikTok'
  const organizationId = formData.get('organizationId') as string

  if (!file || !platform || !organizationId) {
    throw new Error('Missing required upload parameters (file, platform, or organization ID).')
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized access.')
  }

  // Freemium trial usage check
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('upload_count')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    throw new Error('Organization access error.')
  }

  if ((org.upload_count || 0) >= 3) {
    throw new Error('Free trial limit reached. Maximum 3 file uploads allowed in trial mode.')
  }

  // Parse file content
  let rawRows: Record<string, any>[] = []
  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = await file.text()
    const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true })
    rawRows = parseResult.data as Record<string, any>[]
  } else {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, any>[]
  }

  if (rawRows.length === 0) {
    throw new Error('Uploaded spreadsheet appears to be empty.')
  }

  // Map platform columns to normalized metric rows
  const normalizedRows: NormalizedEtlRow[] = []
  for (const row of rawRows) {
    // Regex column matching for Shopee / TikTok English & Indonesian headers
    const nameRegex = platform === 'Shopee'
      ? /nama produk|product name|produk|item name/i
      : /item name|product name|nama produk|produk/i
    const spendRegex = platform === 'Shopee'
      ? /biaya|spend|expense|pengeluaran/i
      : /cost|biaya|pengeluaran|spend/i
    const viewsRegex = platform === 'Shopee'
      ? /dilihat|views|impressions|tayangan/i
      : /impressions|views|tayangan|dilihat/i
    const clicksRegex = /klik|clicks|click/i
    const ordersRegex = /pesanan|orders|conversions|penjualan/i
    const revenueRegex = platform === 'Shopee'
      ? /omzet|revenue|gmv|gross/i
      : /revenue|pendapatan|omzet|gmv/i
    const dateRegex = /tanggal|date|day|time/i

    const originalName = extractField(row, nameRegex)
    if (!originalName || String(originalName).trim().toLowerCase() === 'total' || String(originalName).trim() === '') {
      continue // Skip summary rows or rows without valid product names
    }

    normalizedRows.push({
      originalName: String(originalName).trim(),
      date: parseDate(extractField(row, dateRegex)),
      spend: parseNumber(extractField(row, spendRegex)),
      views: parseNumber(extractField(row, viewsRegex)),
      clicks: parseNumber(extractField(row, clicksRegex)),
      orders: parseNumber(extractField(row, ordersRegex)),
      revenue: parseNumber(extractField(row, revenueRegex)),
    })
  }

  if (normalizedRows.length === 0) {
    throw new Error('No valid product campaign rows extracted. Please verify column headers match Shopee or TikTok advertising report formats.')
  }

  // Fetch existing master products & mappings
  const masterProducts = await getMasterProducts(organizationId)
  const masterMap = new Map<string, string>() // lowercased master_name -> master_id
  const masterIds: string[] = []
  for (const mp of masterProducts) {
    masterMap.set(mp.master_name.toLowerCase(), mp.id)
    masterIds.push(mp.id)
  }

  let existingMappings: Array<{ original_name: string; master_product_id: string }> = []
  if (masterIds.length > 0) {
    const { data: mappingsData } = await supabase
      .from('product_mappings')
      .select('original_name, master_product_id')
      .eq('platform', platform)
      .in('master_product_id', masterIds)
    if (mappingsData) {
      existingMappings = mappingsData
    }
  }

  const mappingLookup = new Map<string, string>() // lowercased original_name -> master_product_id
  for (const m of existingMappings) {
    mappingLookup.set(m.original_name.toLowerCase(), m.master_product_id)
  }

  // Identify unmapped products
  const unrecognizedSet = new Set<string>()
  for (const item of normalizedRows) {
    const lowerName = item.originalName.toLowerCase()
    let foundMasterId = mappingLookup.get(lowerName) || masterMap.get(lowerName)
    if (foundMasterId) {
      item.masterProductId = foundMasterId
    } else {
      unrecognizedSet.add(item.originalName)
    }
  }

  // If unmapped items exist, pause and request user resolution via smart mapping UI
  if (unrecognizedSet.size > 0) {
    return {
      status: 'REQUIRES_MAPPING',
      unrecognizedProducts: Array.from(unrecognizedSet),
      normalizedRows
    }
  }

  // All items recognized -> execute direct UPSERT
  return await executeEtlCommit(supabase, organizationId, platform, normalizedRows, org.upload_count || 0)
}

export async function resolveMappingsAndCommit(
  organizationId: string,
  platform: 'Shopee' | 'TikTok',
  resolutions: MappingResolutionItem[],
  pendingRows: NormalizedEtlRow[]
): Promise<EtlUploadResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized access.')
  }

  // Verify usage again before commit
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('upload_count')
    .eq('id', organizationId)
    .single()

  if (orgError || !org || (org.upload_count || 0) >= 3) {
    throw new Error('Free trial limit reached or organization inaccessible.')
  }

  const resolutionMap = new Map<string, string>() // lowercased original_name -> resolved master_product_id

  for (const item of resolutions) {
    let masterId: string
    if (item.isNewMaster) {
      // Check if master already exists in database first
      const { data: existingMaster } = await supabase
        .from('master_products')
        .select('id')
        .eq('organization_id', organizationId)
        .ilike('master_name', item.targetMasterIdOrName)
        .single()

      if (existingMaster) {
        masterId = existingMaster.id
      } else {
        const { data: createdMaster, error: createError } = await supabase
          .from('master_products')
          .insert({
            organization_id: organizationId,
            master_name: item.targetMasterIdOrName.trim(),
          })
          .select('id')
          .single()

        if (createError || !createdMaster) {
          throw new Error(`Failed to create master product "${item.targetMasterIdOrName}": ${createError?.message || 'Error'}`)
        }
        masterId = createdMaster.id
      }
    } else {
      masterId = item.targetMasterIdOrName
    }

    resolutionMap.set(item.originalName.toLowerCase(), masterId)

    // Save product mapping for automatic recognition in future uploads
    await supabase
      .from('product_mappings')
      .upsert({
        master_product_id: masterId,
        platform,
        original_name: item.originalName.trim()
      }, { onConflict: 'master_product_id,platform,original_name' })
  }

  // Update rows with new master IDs
  for (const row of pendingRows) {
    if (!row.masterProductId) {
      const resolved = resolutionMap.get(row.originalName.toLowerCase())
      if (!resolved) {
        throw new Error(`Mapping incomplete for product "${row.originalName}". All unrecognized products must be resolved.`)
      }
      row.masterProductId = resolved
    }
  }

  return await executeEtlCommit(supabase, organizationId, platform, pendingRows, org.upload_count || 0)
}

async function executeEtlCommit(
  supabase: any,
  organizationId: string,
  platform: 'Shopee' | 'TikTok',
  rows: NormalizedEtlRow[],
  currentUploadCount: number
): Promise<EtlUploadResult> {
  const records = rows.map((r) => ({
    organization_id: organizationId,
    platform,
    product_id: r.masterProductId,
    date: r.date,
    spend: r.spend,
    views: r.views,
    clicks: r.clicks,
    orders: r.orders,
    revenue: r.revenue,
    updated_at: new Date().toISOString()
  }))

  // Batch UPSERT into campaign_metrics without duplicate errors on overlapping date ranges
  const { error: upsertError } = await supabase
    .from('campaign_metrics')
    .upsert(records, { onConflict: 'organization_id,platform,product_id,date' })

  if (upsertError) {
    console.error('ETL Upsert Error:', upsertError)
    throw new Error(`Failed to commit analytics data: ${upsertError.message}`)
  }

  // Increment organization upload count for trial tracking
  const newCount = currentUploadCount + 1
  const { error: updateOrgError } = await supabase
    .from('organizations')
    .update({ upload_count: newCount })
    .eq('id', organizationId)

  if (updateOrgError) {
    console.warn('Failed to increment organization upload count:', updateOrgError.message)
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/upload')

  return {
    status: 'SUCCESS',
    summary: {
      rowsProcessed: records.length,
      uploadCount: newCount
    }
  }
}

/**
 * Programmatically injects New Balance sales demo data (2022-2025 baseline & recent 15 days)
 * without wiping manual user ETL uploads.
 */
export async function injectDemoData(organizationId: string): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = await createClient()

  // ==========================================
  // STEP 1: CREATE CLIENT (BOTTOM-UP RELATIONAL ARCHITECTURE)
  // ==========================================
  let { data: clientData } = await supabase
    .from('clients')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('name', 'Senikersku')
    .maybeSingle()

  let clientId: string
  if (!clientData) {
    const { data: newClient, error: clientErr } = await supabase
      .from('clients')
      .insert({ organization_id: organizationId, name: 'Senikersku' })
      .select('id')
      .single()

    if (clientErr || !newClient) {
      console.error('Failed to create Senikersku client:', clientErr)
      return { success: false, count: 0, error: clientErr?.message || 'Failed to create client Senikersku' }
    }
    clientId = newClient.id
  } else {
    clientId = clientData.id
  }

  // ==========================================
  // STEP 2: CREATE STORES LINKED TO SENIKERSKU
  // ==========================================
  const storeDefinitions = [
    { name: 'Shopee - Senikersku', platform: 'Shopee' },
    { name: 'TikTok Shop - Senikersku', platform: 'TikTok' }
  ]
  const storeIdMap: Record<string, string> = {}

  for (const st of storeDefinitions) {
    let { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .eq('name', st.name)
      .maybeSingle()

    if (!storeData) {
      const { data: newStore, error: storeErr } = await supabase
        .from('stores')
        .insert({
          organization_id: organizationId,
          client_id: clientId,
          name: st.name,
          platform: st.platform
        })
        .select('id')
        .single()

      if (storeErr || !newStore) {
        console.error(`Failed to create store ${st.name}:`, storeErr)
        return { success: false, count: 0, error: storeErr?.message || `Failed to create store ${st.name}` }
      }
      storeIdMap[st.platform] = newStore.id
    } else {
      storeIdMap[st.platform] = storeData.id
    }
  }

  // ==========================================
  // STEP 3: CREATE AUDITS & FINDINGS LINKED TO STORES
  // ==========================================
  const { data: authData } = await supabase.auth.getUser()
  let auditorId = authData?.user?.id
  if (!auditorId) {
    const { data: member } = await supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle()
    auditorId = member?.user_id
  }

  let { data: tmplData } = await supabase
    .from('audit_templates')
    .select('id')
    .eq('organization_id', organizationId)
    .limit(1)
    .maybeSingle()

  let templateId = tmplData?.id
  if (!templateId) {
    let { data: globalTmpl } = await supabase
      .from('audit_templates')
      .select('id')
      .is('organization_id', null)
      .limit(1)
      .maybeSingle()
    if (globalTmpl) {
      templateId = globalTmpl.id
    } else {
      const { data: newTmpl } = await supabase
        .from('audit_templates')
        .insert({
          organization_id: organizationId,
          name: 'Q3 E-Commerce Performance & Operations Audit',
          description: 'Standardized evaluation of campaign efficiency, keyword exclusions, and promotional creative freshness.'
        })
        .select('id')
        .single()
      templateId = newTmpl?.id
    }
  }

  if (templateId && auditorId) {
    for (const [platform, storeId] of Object.entries(storeIdMap)) {
      let { data: existingAudit } = await supabase
        .from('audits')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('store_id', storeId)
        .limit(1)
        .maybeSingle()

      let auditId = existingAudit?.id
      if (!auditId) {
        const { data: newAudit } = await supabase
          .from('audits')
          .insert({
            organization_id: organizationId,
            store_id: storeId,
            template_id: templateId,
            auditor_id: auditorId,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .select('id')
          .single()
        auditId = newAudit?.id
      }

      if (auditId) {
        // Clear older demo findings on this audit for clean idempotency
        await supabase.from('findings').delete().eq('audit_id', auditId)

        const findingsPayload = platform === 'Shopee' ? [
          {
            title: 'Missing Negative Keywords on New Balance 550 Search Ads',
            severity: 'High' as const,
            status: 'Open' as const,
            description: 'Broad matching is capturing irrelevant budget from discount apparel searches, inflating overall CPA by 18%.',
            action: { title: 'Inject Exact Negative Match Keywords', desc: 'Add "cheap", "replicas", and "kids size" to negative keyword list in Shopee Seller Centre.', priority: 'High' as const }
          },
          {
            title: 'Optimal ROAS Performance on 2002R Protection Pack',
            severity: 'Low' as const,
            status: 'Resolved' as const,
            description: 'Discovery advertising campaigns are exceeding baseline benchmark targets at an elite 4.2x ROAS.',
            action: { title: 'Scale Daily Ad Budget by 25%', desc: 'Increase daily cap on top-performing discovery ad groups while monitoring conversion rate.', priority: 'Medium' as const }
          }
        ] : [
          {
            title: 'Ad Fatigue on Video Creatives for 530 Silver',
            severity: 'Critical' as const,
            status: 'Open' as const,
            description: 'Click-through rate (CTR) dropped below 0.8% over the last 5 days as audience saturation hit 3.4x frequency.',
            action: { title: 'Deploy 3 New UGC Video Hook Variations', desc: 'Commission Gen-Z style unboxing and lifestyle pairing shorts with hook-in-first-2-seconds pacing.', priority: 'High' as const }
          },
          {
            title: 'High Checkout Abandonment on TikTok Shop Custom Link',
            severity: 'Medium' as const,
            status: 'Open' as const,
            description: 'Users drop off during voucher code application on 1906R Utility checkouts.',
            action: { title: 'Enable Automatic Bundle Discount Rules', desc: 'Remove manual promo code entry and replace with auto-applied TikTok Store promotional vouchers.', priority: 'Medium' as const }
          }
        ]

        for (const f of findingsPayload) {
          const { data: createdFinding } = await supabase
            .from('findings')
            .insert({
              organization_id: organizationId,
              audit_id: auditId,
              title: f.title,
              description: f.description,
              severity: f.severity,
              status: f.status
            })
            .select('id')
            .single()

          if (createdFinding) {
            await supabase.from('recommendations').insert({
              finding_id: createdFinding.id,
              action_title: f.action.title,
              action_description: f.action.desc,
              priority: f.action.priority
            })
          }
        }
      }
    }
  }

  // ==========================================
  // STEP 4: INJECT CAMPAIGN METRICS LINKED TO STORES & CLIENT
  // ==========================================
  const nbMasterNames = [
    'New Balance 550 White Green - Retro Basketball',
    'New Balance 530 Classic Silver - Running Sneaker',
    'New Balance 2002R Protection Pack - Rain Cloud',
    'New Balance 990v6 Made in USA - Castlerock',
    'New Balance 1906R Utility - Triple Black'
  ]

  const productUpsertData = nbMasterNames.map(name => ({
    organization_id: organizationId,
    client_id: clientId,
    master_name: name
  }))

  const { error: prodError } = await supabase
    .from('master_products')
    .upsert(productUpsertData, { onConflict: 'organization_id,master_name' })

  if (prodError) {
    // If client_id doesn't exist yet on master_products, fallback gracefully without it
    await supabase.from('master_products').upsert(
      nbMasterNames.map(name => ({ organization_id: organizationId, master_name: name })),
      { onConflict: 'organization_id,master_name' }
    )
  }

  const { data: masters, error: mastersError } = await supabase
    .from('master_products')
    .select('id, master_name')
    .eq('organization_id', organizationId)
    .in('master_name', nbMasterNames)

  if (mastersError || !masters || masters.length === 0) {
    return { success: false, count: 0, error: mastersError?.message || 'Master products not found' }
  }

  const idMap = new Map<string, string>()
  masters.forEach(m => idMap.set(m.master_name, m.id))

  const demoRecordsRaw = [
    // Cluster A: Historical Baseline (2022 - 2025)
    { platform: 'Shopee', name: 'New Balance 550 White Green - Retro Basketball', date: '2022-03-15', spend: 8500000, views: 125000, clicks: 4200, orders: 145, revenue: 34800000 },
    { platform: 'TikTok', name: 'New Balance 550 White Green - Retro Basketball', date: '2022-08-21', spend: 12400000, views: 210000, clicks: 6800, orders: 230, revenue: 57500000 },
    { platform: 'Shopee', name: 'New Balance 530 Classic Silver - Running Sneaker', date: '2022-11-11', spend: 15000000, views: 280000, clicks: 8500, orders: 310, revenue: 74400000 },
    { platform: 'TikTok', name: 'New Balance 2002R Protection Pack - Rain Cloud', date: '2022-12-12', spend: 18500000, views: 350000, clicks: 9900, orders: 380, revenue: 98800000 },
    { platform: 'Shopee', name: 'New Balance 2002R Protection Pack - Rain Cloud', date: '2023-04-10', spend: 14200000, views: 195000, clicks: 7100, orders: 265, revenue: 68900000 },
    { platform: 'TikTok', name: 'New Balance 990v6 Made in USA - Castlerock', date: '2023-09-09', spend: 21000000, views: 410000, clicks: 11500, orders: 420, revenue: 117600000 },
    { platform: 'Shopee', name: 'New Balance 1906R Utility - Triple Black', date: '2023-12-12', spend: 16800000, views: 240000, clicks: 8200, orders: 290, revenue: 78300000 },
    { platform: 'TikTok', name: 'New Balance 530 Classic Silver - Running Sneaker', date: '2024-02-14', spend: 19500000, views: 310000, clicks: 9600, orders: 355, revenue: 88750000 },
    { platform: 'Shopee', name: 'New Balance 990v6 Made in USA - Castlerock', date: '2024-06-06', spend: 24500000, views: 480000, clicks: 13400, orders: 490, revenue: 137200000 },
    { platform: 'TikTok', name: 'New Balance 1906R Utility - Triple Black', date: '2024-10-10', spend: 22000000, views: 390000, clicks: 10800, orders: 400, revenue: 108000000 },
    { platform: 'Shopee', name: 'New Balance 550 White Green - Retro Basketball', date: '2025-01-25', spend: 18000000, views: 270000, clicks: 8400, orders: 320, revenue: 80000000 },
    { platform: 'TikTok', name: 'New Balance 530 Classic Silver - Running Sneaker', date: '2025-05-05', spend: 26000000, views: 520000, clicks: 14200, orders: 530, revenue: 143100000 },
    { platform: 'Shopee', name: 'New Balance 2002R Protection Pack - Rain Cloud', date: '2025-09-09', spend: 28500000, views: 610000, clicks: 16000, orders: 590, revenue: 165200000 },

    // Cluster B: Recent Short-Term Cluster (Last 15 Days -> July 20 to August 3, 2026)
    { platform: 'Shopee', name: 'New Balance 550 White Green - Retro Basketball', date: '2026-07-21', spend: 1200000, views: 18500, clicks: 620, orders: 24, revenue: 5760000 },
    { platform: 'TikTok', name: 'New Balance 550 White Green - Retro Basketball', date: '2026-07-23', spend: 1850000, views: 29000, clicks: 940, orders: 36, revenue: 8990000 },
    { platform: 'Shopee', name: 'New Balance 530 Classic Silver - Running Sneaker', date: '2026-07-24', spend: 2100000, views: 34000, clicks: 1120, orders: 42, revenue: 10920000 },
    { platform: 'TikTok', name: 'New Balance 530 Classic Silver - Running Sneaker', date: '2026-07-26', spend: 3200000, views: 51000, clicks: 1680, orders: 64, revenue: 17280000 },
    { platform: 'Shopee', name: 'New Balance 2002R Protection Pack - Rain Cloud', date: '2026-07-27', spend: 2450000, views: 38000, clicks: 1250, orders: 48, revenue: 12960000 },
    { platform: 'TikTok', name: 'New Balance 2002R Protection Pack - Rain Cloud', date: '2026-07-29', spend: 3900000, views: 62000, clicks: 2100, orders: 78, revenue: 21840000 },
    { platform: 'Shopee', name: 'New Balance 990v6 Made in USA - Castlerock', date: '2026-07-30', spend: 4500000, views: 71000, clicks: 2450, orders: 92, revenue: 26680000 },
    { platform: 'TikTok', name: 'New Balance 990v6 Made in USA - Castlerock', date: '2026-08-01', spend: 5200000, views: 85000, clicks: 2900, orders: 108, revenue: 32400000 },
    { platform: 'Shopee', name: 'New Balance 1906R Utility - Triple Black', date: '2026-08-02', spend: 2800000, views: 44000, clicks: 1450, orders: 55, revenue: 14850000 },
    { platform: 'TikTok', name: 'New Balance 1906R Utility - Triple Black', date: '2026-08-03', spend: 3500000, views: 56000, clicks: 1820, orders: 68, revenue: 18700000 }
  ]

  const fullMetricsPayload = demoRecordsRaw.map(r => ({
    organization_id: organizationId,
    client_id: clientId,
    store_id: storeIdMap[r.platform] || null,
    platform: r.platform,
    product_id: idMap.get(r.name) || '',
    date: r.date,
    spend: r.spend,
    views: r.views,
    clicks: r.clicks,
    orders: r.orders,
    revenue: r.revenue,
    updated_at: new Date().toISOString()
  })).filter(r => r.product_id !== '')

  const { error: upsertError } = await supabase
    .from('campaign_metrics')
    .upsert(fullMetricsPayload, { onConflict: 'organization_id,platform,product_id,date' })

  if (upsertError) {
    // If client_id/store_id columns haven't been applied to DB yet, retry without them to prevent complete breakages
    console.warn('Upsert with client_id/store_id failed, falling back to base payload:', upsertError)
    const basePayload = demoRecordsRaw.map(r => ({
      organization_id: organizationId,
      platform: r.platform,
      product_id: idMap.get(r.name) || '',
      date: r.date,
      spend: r.spend,
      views: r.views,
      clicks: r.clicks,
      orders: r.orders,
      revenue: r.revenue,
      updated_at: new Date().toISOString()
    })).filter(r => r.product_id !== '')

    const { error: fallbackError } = await supabase
      .from('campaign_metrics')
      .upsert(basePayload, { onConflict: 'organization_id,platform,product_id,date' })
    if (fallbackError) {
      console.error('Failed fallback injection of campaign metrics:', fallbackError)
      return { success: false, count: 0, error: fallbackError.message }
    }
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/upload')

  return { success: true, count: fullMetricsPayload.length }
}

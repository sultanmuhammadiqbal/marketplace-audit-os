'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerformanceSummaryTable } from '@/components/dashboard/performance-summary-table'
import { InjectDemoDataButton } from '@/components/dashboard/inject-demo-data-button'
import { ActionableFindingsWidget } from '@/components/dashboard/actionable-findings-widget'
import { 
  getPerformanceSummary, 
  getOrganizationClientsAndStores,
  getActionableFindings,
  PerformanceSummaryResult,
  CascadingFilterOption,
  ActionableFindingItem
} from '@/server/actions/analytics'
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  ShoppingCart, 
  Sparkles, 
  Activity,
  ArrowUpRight,
  Filter,
  Layers,
  Store,
  Users
} from 'lucide-react'

interface DashboardAnalyticsProps {
  organizationId: string
}

type TimeframePreset = 'last_15_days' | 'last_30_days' | 'ytd_2026' | 'historical_2022_2025' | 'custom'

interface TimeframeConfig {
  label: string
  shortLabel: string
  startDate: string
  endDate: string
}

const PRESET_CONFIGS: Record<Exclude<TimeframePreset, 'custom'>, TimeframeConfig> = {
  last_15_days: {
    label: 'Last 15 Days (Recent Pace)',
    shortLabel: 'Last 15 Days',
    startDate: '2026-07-20',
    endDate: '2026-08-03'
  },
  last_30_days: {
    label: 'Last 30 Days (Standard Monthly)',
    shortLabel: 'Last 30 Days',
    startDate: '2026-07-04',
    endDate: '2026-08-03'
  },
  ytd_2026: {
    label: 'Year to Date (2026)',
    shortLabel: '2026 YTD',
    startDate: '2026-01-01',
    endDate: '2026-08-03'
  },
  historical_2022_2025: {
    label: 'Historical Baseline (Years 2022 - 2025)',
    shortLabel: '2022 - 2025 Baseline',
    startDate: '2022-01-01',
    endDate: '2025-12-31'
  }
}

function formatCurrency(num: number | undefined): string {
  if (num === undefined || isNaN(num) || num === 0) return 'Rp 0'
  return 'Rp ' + Math.round(num).toLocaleString('id-ID')
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || isNaN(num)) return '0'
  return Math.round(num).toLocaleString('id-ID')
}

export function DashboardAnalytics({ organizationId }: DashboardAnalyticsProps) {
  const [activePreset, setActivePreset] = useState<TimeframePreset>('last_15_days')
  const [customStartDate, setCustomStartDate] = useState<string>('2026-07-01')
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-03')

  // Relational Cascading Entities
  const [clients, setClients] = useState<CascadingFilterOption[]>([])
  const [stores, setStores] = useState<CascadingFilterOption[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedStore, setSelectedStore] = useState<string>('all')

  const [data, setData] = useState<PerformanceSummaryResult | null>(null)
  const [findings, setFindings] = useState<ActionableFindingItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isFindingsLoading, setIsFindingsLoading] = useState<boolean>(true)
  
  // CRITICAL: timeframeKey forces total unmount and state reset of table when timeframe or cascading filter changes
  const [timeframeKey, setTimeframeKey] = useState<number>(1)

  // Fetch relational filter options
  const fetchFilterEntities = useCallback(async () => {
    try {
      const entities = await getOrganizationClientsAndStores(organizationId)
      let cls = entities.clients
      let sts = entities.stores
      if (cls.length === 0) {
        cls = [{ id: 'demo-client-senikersku', name: 'Senikersku' }]
        sts = [
          { id: 'demo-store-shopee', name: 'Shopee - Senikersku', clientId: 'demo-client-senikersku', platform: 'Shopee' },
          { id: 'demo-store-tiktok', name: 'TikTok Shop - Senikersku', clientId: 'demo-client-senikersku', platform: 'TikTok' }
        ]
      }
      setClients(cls)
      setStores(sts)
    } catch (err) {
      console.error('Failed to load filter entities:', err)
    }
  }, [organizationId])

  useEffect(() => {
    fetchFilterEntities()
  }, [fetchFilterEntities])

  const fetchData = useCallback(async (start: string, end: string, clientId: string, storeId: string) => {
    setData(null)
    setIsLoading(true)
    setIsFindingsLoading(true)
    setTimeframeKey((prev) => prev + 1)

    try {
      const [result, findingsRes] = await Promise.all([
        getPerformanceSummary(organizationId, start, end, clientId, storeId),
        getActionableFindings(organizationId, clientId, storeId)
      ])
      setData(result)
      setFindings(findingsRes)
    } catch (error) {
      console.error('Failed to fetch analytics and findings:', error)
      setData(null)
      setFindings([])
    } finally {
      setIsLoading(false)
      setIsFindingsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (activePreset !== 'custom') {
      const config = PRESET_CONFIGS[activePreset]
      fetchData(config.startDate, config.endDate, selectedClient, selectedStore)
    } else {
      fetchData(customStartDate, customEndDate, selectedClient, selectedStore)
    }
  }, [activePreset, fetchData, customStartDate, customEndDate, selectedClient, selectedStore])

  const handlePresetSelect = (preset: TimeframePreset) => {
    if (preset === activePreset && preset !== 'custom') return
    setActivePreset(preset)
  }

  const handleDemoInjected = () => {
    fetchFilterEntities()
    if (activePreset !== 'custom') {
      const config = PRESET_CONFIGS[activePreset]
      fetchData(config.startDate, config.endDate, selectedClient, selectedStore)
    } else {
      fetchData(customStartDate, customEndDate, selectedClient, selectedStore)
    }
  }

  const availableStores = selectedClient === 'all'
    ? stores
    : stores.filter(s => s.clientId === selectedClient || s.clientId === 'demo-client-senikersku' || !s.clientId)

  const kpis = data?.kpis
  const isPositiveRoas = (kpis?.blendedRoas || 0) >= 2.0
  const isEliteRoas = (kpis?.blendedRoas || 0) >= 3.5

  return (
    <div className="space-y-8">
      {/* GA4-Style Cascading Relational Filters & Timeframe Engine */}
      <div className="flex flex-col gap-6 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl transition-all duration-200">
        {/* Top Tier: Relational Cascading Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 dark:border-zinc-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 flex items-center justify-center shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-black tracking-tight text-gray-900 dark:text-white uppercase flex items-center gap-2">
                  GA4 Cascading Analytics Filter
                  {isLoading && (
                    <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 animate-pulse">
                      Updating metrics...
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Instantaneous client and marketplace store segmentation without page reloading.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown 1: Select Client */}
            <div className="flex flex-col gap-1.5 min-w-[220px]">
              <label htmlFor="client-select-dropdown" className="text-[11px] font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> 1. Select Client
              </label>
              <select
                id="client-select-dropdown"
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value)
                  setSelectedStore('all') // Cascade reset
                }}
                className="h-11 px-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-extrabold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all cursor-pointer"
              >
                <option value="all">All Clients (Consolidated)</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Dropdown 2: Select Store (Dynamically Populated) */}
            <div className="flex flex-col gap-1.5 min-w-[240px]">
              <label htmlFor="store-select-dropdown" className="text-[11px] font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-purple-500" /> 2. Select Store (Cascades)
              </label>
              <select
                id="store-select-dropdown"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="h-11 px-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-extrabold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all cursor-pointer"
              >
                <option value="all">All Stores ({selectedClient === 'all' ? 'All Channels' : 'Client Stores'})</option>
                {availableStores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.platform || 'General'})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Second Tier: Timeframe Context Engine */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary border border-blue-100 dark:border-primary/20 flex items-center justify-center shadow-inner flex-shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
                Timeframe Context Engine
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Switching between short-term pace and historical baseline invokes strict state clears.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/80 px-3.5 py-2 rounded-2xl border border-gray-200 dark:border-zinc-700">
              <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-primary mr-0.5" />
              <span>Active Window:</span>
              <span className="font-extrabold text-gray-900 dark:text-white">
                {activePreset === 'custom' ? `${customStartDate} → ${customEndDate}` : PRESET_CONFIGS[activePreset].shortLabel}
              </span>
            </div>

            {/* Subtle Inject Demo Data Button inside analytics panel */}
            <InjectDemoDataButton
              organizationId={organizationId}
              onSuccess={handleDemoInjected}
            />
          </div>
        </div>

        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
          {(Object.keys(PRESET_CONFIGS) as Array<Exclude<TimeframePreset, 'custom'>>).map((key) => {
            const isSelected = activePreset === key
            return (
              <button
                key={key}
                onClick={() => handlePresetSelect(key)}
                disabled={isLoading && isSelected}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-sm border ${
                  isSelected
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-primary dark:text-primary-foreground dark:border-primary shadow-md scale-[1.02]'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-400 dark:hover:text-white dark:border-zinc-700'
                }`}
              >
                {PRESET_CONFIGS[key].shortLabel}
              </button>
            )
          })}
          
          <button
            onClick={() => handlePresetSelect('custom')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-sm border ${
              activePreset === 'custom'
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-primary dark:text-primary-foreground dark:border-primary shadow-md scale-[1.02]'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-400 dark:hover:text-white dark:border-zinc-700'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Range Inputs */}
        {activePreset === 'custom' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Set Dates:
            </span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}
      </div>

      {/* KPI Metric Cards with Perfect Light/Dark Contrast */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Ad Spend */}
        <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-md hover:shadow-xl dark:shadow-2xl transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">Total Ad Spend</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="h-9 w-40 rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold tracking-tight font-mono text-gray-900 dark:text-white">
                {formatCurrency(kpis?.totalSpend)}
              </div>
            )}
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
              Capital allocated across ad channels
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Revenue */}
        <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-emerald-500/40 rounded-3xl shadow-md hover:shadow-xl dark:shadow-2xl dark:hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-90" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-black tracking-widest uppercase text-emerald-700 dark:text-emerald-400">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="h-9 w-44 rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold tracking-tight font-mono text-emerald-600 dark:text-emerald-400 dark:drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                {formatCurrency(kpis?.totalRevenue)}
              </div>
            )}
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Gross Merchandise Value (GMV)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Blended ROAS */}
        <Card className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-primary/40 hover:border-blue-600 dark:hover:border-primary rounded-3xl shadow-md hover:shadow-xl dark:shadow-2xl dark:hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-emerald-50 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-black tracking-widest uppercase text-gray-900 dark:text-primary flex items-center gap-1.5">
              Blended ROAS
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            </CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-primary/15 text-blue-600 dark:text-primary border border-blue-100 dark:border-primary/30 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-sm dark:shadow-lg dark:shadow-primary/20">
              <Zap className="h-5 w-5 fill-current" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="h-10 w-28 rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black tracking-tight font-mono ${
                  isEliteRoas 
                    ? 'text-emerald-600 dark:text-emerald-400 dark:drop-shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-pulse' 
                    : isPositiveRoas 
                    ? 'text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]' 
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {kpis?.blendedRoas || 0}x
                </span>
                {isEliteRoas && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 uppercase tracking-wider">
                    Elite 🔥
                  </span>
                )}
              </div>
            )}
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-primary" />
              Return on Advertising Spend ratio
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Overall CPA */}
        <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-purple-500/40 rounded-3xl shadow-md hover:shadow-xl dark:shadow-2xl dark:hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-black tracking-widest uppercase text-purple-700 dark:text-purple-400">Overall CPA</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="h-9 w-32 rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            ) : (
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold tracking-tight font-mono text-purple-700 dark:text-purple-300">
                  {formatCurrency(kpis?.overallCpa)}
                </span>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-zinc-700">
                  {formatNumber(kpis?.totalOrders)} Orders
                </span>
              </div>
            )}
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              Cost Per Acquisition (Spend / Orders)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Findings & Solutions Widget (Reacts to Cascading Selection) */}
      <div key={`findings-${timeframeKey}`}>
        <ActionableFindingsWidget
          findings={findings}
          isLoading={isFindingsLoading}
        />
      </div>

      {/* Performance Summary Table with Strict State Reset Key */}
      <div key={timeframeKey} className="transition-opacity duration-300">
        <PerformanceSummaryTable
          metrics={data?.metrics || []}
          isLoading={isLoading || !data}
        />
      </div>
    </div>
  )
}

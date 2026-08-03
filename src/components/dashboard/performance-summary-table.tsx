'use client'

import React, { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductPerformanceSummary } from '@/server/actions/analytics'
import { ArrowUpDown, Search, TrendingUp, Sparkles, AlertCircle, ShoppingCart, MousePointer, DollarSign } from 'lucide-react'

interface PerformanceSummaryTableProps {
  metrics: ProductPerformanceSummary[]
  isLoading: boolean
}

type SortField = 'productName' | 'platform' | 'spend' | 'revenue' | 'clicks' | 'orders' | 'roas' | 'cpa'
type SortOrder = 'asc' | 'desc'

function formatCurrency(num: number): string {
  if (isNaN(num) || num === 0) return 'Rp 0'
  return 'Rp ' + Math.round(num).toLocaleString('id-ID')
}

function formatNumber(num: number): string {
  if (isNaN(num)) return '0'
  return Math.round(num).toLocaleString('id-ID')
}

export function PerformanceSummaryTable({ metrics, isLoading }: PerformanceSummaryTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('revenue')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder(field === 'productName' || field === 'platform' ? 'asc' : 'desc')
    }
  }

  const filteredAndSortedMetrics = useMemo(() => {
    if (isLoading) return []
    const query = searchQuery.toLowerCase().trim()
    const filtered = metrics.filter((m) => {
      return (
        m.productName.toLowerCase().includes(query) ||
        m.platform.toLowerCase().includes(query)
      )
    })

    filtered.sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }
      const numA = Number(valA) || 0
      const numB = Number(valB) || 0
      return sortOrder === 'asc' ? numA - numB : numB - numA
    })

    return filtered
  }, [metrics, searchQuery, sortField, sortOrder, isLoading])

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-lg dark:shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-zinc-800 pb-4">
          <div>
            <div className="h-6 w-48 rounded-lg bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-72 rounded-lg bg-gray-100/60 dark:bg-zinc-800/60 mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-full sm:w-72 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 w-full rounded-2xl bg-gray-50 dark:bg-zinc-800/40 animate-pulse border border-gray-100 dark:border-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg dark:shadow-2xl overflow-hidden relative group transition-colors duration-200">
      {/* Header Controls */}
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/70 dark:bg-zinc-800/40">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-primary animate-pulse" />
            <h3 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Performance Summary Table
            </h3>
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
            Granular product-level advertising metrics & conversion efficiency across Shopee and TikTok Shop.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search New Balance lines or channel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[850px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-zinc-800">
              <TableHead 
                onClick={() => handleSort('productName')}
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold select-none py-3.5 w-[28%]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product Line</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('platform')}
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold select-none text-center w-[12%]"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Platform</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('spend')}
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold select-none text-right w-[13%]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 opacity-80" />
                  <span>Ad Spend</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('revenue')}
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold select-none text-right w-[15%]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 opacity-80" />
                  <span>Revenue (GMV)</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('clicks')}
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold select-none text-right w-[10%]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <MousePointer className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 opacity-80" />
                  <span>Clicks</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('orders')}
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold select-none text-right w-[9%]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 opacity-80" />
                  <span>Orders</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('cpa')}
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold select-none text-right w-[13%]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>CPA</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('roas')}
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold select-none text-right w-[12%]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>ROAS</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedMetrics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 space-y-2">
                    <AlertCircle className="h-8 w-8 opacity-60" />
                    <p className="text-sm font-bold">No product performance data found</p>
                    <p className="text-xs">Try adjusting your date range, filters, or clicking &quot;Inject Demo Data&quot;.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedMetrics.map((row) => {
                const isHighRoas = row.roas >= 3.5
                const isGoodRoas = row.roas >= 2.0 && row.roas < 3.5

                return (
                  <TableRow 
                    key={`${row.productId}-${row.platform}`}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800/70 transition-colors cursor-default group/row"
                  >
                    {/* Product Name */}
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white group-hover/row:text-blue-600 dark:group-hover/row:text-primary transition-colors">
                          {row.productName}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                          ID: {row.productId}
                        </span>
                      </div>
                    </TableCell>

                    {/* Platform Badge */}
                    <TableCell className="text-center">
                      {row.platform === 'Shopee' ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30 shadow-sm">
                          Shopee
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-zinc-800 dark:text-cyan-400 dark:border-cyan-500/30 shadow-sm">
                          TikTok Shop
                        </span>
                      )}
                    </TableCell>

                    {/* Spend */}
                    <TableCell className="text-right font-bold text-sm text-gray-600 dark:text-gray-300 font-mono">
                      {formatCurrency(row.spend)}
                    </TableCell>

                    {/* Revenue */}
                    <TableCell className="text-right font-extrabold text-sm text-gray-900 dark:text-white font-mono">
                      {formatCurrency(row.revenue)}
                    </TableCell>

                    {/* Clicks */}
                    <TableCell className="text-right font-bold text-sm text-gray-600 dark:text-gray-300 font-mono">
                      {formatNumber(row.clicks)}
                    </TableCell>

                    {/* Orders */}
                    <TableCell className="text-right font-extrabold text-sm text-purple-700 dark:text-purple-400 font-mono">
                      {formatNumber(row.orders)}
                    </TableCell>

                    {/* CPA */}
                    <TableCell className="text-right font-mono">
                      <span className="inline-block px-2.5 py-1 rounded-lg font-extrabold text-sm text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 shadow-sm">
                        {formatCurrency(row.cpa)}
                      </span>
                    </TableCell>

                    {/* ROAS */}
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end font-black font-mono">
                        {isHighRoas ? (
                          <span className="px-3 py-1 rounded-xl text-xs sm:text-sm bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse shadow-sm">
                            {row.roas}x 🔥
                          </span>
                        ) : isGoodRoas ? (
                          <span className="px-3 py-1 rounded-xl text-xs sm:text-sm bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 font-bold shadow-sm">
                            {row.roas}x
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-xs sm:text-sm bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 font-semibold shadow-sm">
                            {row.roas}x
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
        <span>Showing {filteredAndSortedMetrics.length} of {metrics.length} normalized campaign lines</span>
        <span className="text-blue-600 dark:text-primary font-bold">Gen Z High-Contrast Data Engine • Active RLS</span>
      </div>
    </div>
  )
}

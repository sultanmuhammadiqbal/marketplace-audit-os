'use client'

import React from 'react'
import Link from 'next/link'
import { ActionableFindingItem } from '@/server/actions/analytics'
import { AlertTriangle, ShieldAlert, Zap, Store, ArrowRight } from 'lucide-react'

interface ActionableFindingsWidgetProps {
  findings: ActionableFindingItem[]
  isLoading?: boolean
}

export function ActionableFindingsWidget({ findings, isLoading = false }: ActionableFindingsWidgetProps) {
  // Enforce strictly max 3 open items sorted by urgency as defensive protection
  const openFindings = findings.filter(f => f.status === 'Open').slice(0, 3)
  const criticalCount = openFindings.filter(f => f.severity === 'Critical' || f.severity === 'High').length

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl overflow-hidden transition-all duration-300 flex flex-col">
      {/* Header Bar - Read-Only Google Ads Scorecard Style */}
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 dark:from-zinc-900 dark:via-zinc-800/40 dark:to-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
            <Zap className="h-5 w-5 fill-current animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5 flex-wrap">
              Actionable Findings Scorecard
              <span className="text-[11px] uppercase tracking-wider font-mono font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                Preview Radar (Top 3)
              </span>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {criticalCount} Urgent Open
                </span>
              )}
            </h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              Read-only diagnostic preview. Directing execution directly to dedicated findings workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Compact Scorecard List (Max 3) */}
      <div className="p-6 divide-y divide-gray-100 dark:divide-zinc-800/60 space-y-5">
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <div className="w-8 h-8 border-3 border-gray-300 dark:border-zinc-600 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading Radar Preview...</p>
          </div>
        ) : openFindings.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400 font-bold text-sm">
            All clear! No open actionable findings detected for selected filters.
          </div>
        ) : (
          openFindings.map((finding) => (
            <div key={finding.id} className="pt-5 first:pt-0 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-4 border border-transparent hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-all duration-200">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Severity Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm ${
                      finding.severity === 'Critical'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-extrabold'
                        : finding.severity === 'High'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                    }`}>
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {finding.severity}
                    </span>

                    {/* Store Name Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700">
                      <Store className="w-3 h-3 text-gray-500 dark:text-gray-400 shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-none">{finding.storeName}</span>
                      <span className="text-[10px] font-mono opacity-60">({finding.platform})</span>
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {finding.title}
                  </h4>
                  
                  {finding.description && (
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 line-clamp-1">
                      {finding.description}
                    </p>
                  )}
                </div>

                {/* Recommendation Highlight Snippet */}
                {finding.recommendations && finding.recommendations.length > 0 && (
                  <div className="sm:max-w-[280px] shrink-0 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-300">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                      Recommended Fix:
                    </span>
                    <p className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                      {finding.recommendations[0].action_title}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Google Ads-Style Gateway CTA Footer */}
      <div className="p-4 bg-gray-50/90 dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-end">
        <Link 
          href="/dashboard/findings"
          className="inline-flex items-center gap-2 font-black text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:translate-x-1 transition-all duration-200 group/cta py-1 px-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        >
          <span>View More Findings & Manage Solutions</span>
          <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover/cta:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

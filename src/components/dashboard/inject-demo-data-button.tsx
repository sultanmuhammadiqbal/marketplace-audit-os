'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { injectDemoData } from '@/server/actions/etl'
import { Database, Loader2, CheckCircle2, Sparkles, RefreshCcw } from 'lucide-react'

interface InjectDemoDataButtonProps {
  organizationId: string
  onSuccess?: () => void
  className?: string
}

export function InjectDemoDataButton({ organizationId, onSuccess, className = '' }: InjectDemoDataButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleInject = async () => {
    if (isLoading) return
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const result = await injectDemoData(organizationId)
      if (result.success) {
        setIsSuccess(true)
        // Refresh router state and trigger parent re-fetch immediately
        router.refresh()
        if (onSuccess) {
          onSuccess()
        }
        setTimeout(() => setIsSuccess(false), 4000)
      } else {
        setErrorMsg(result.error || 'Failed to inject demo data')
        setTimeout(() => setErrorMsg(null), 4000)
      }
    } catch (err: any) {
      console.error('Error injecting demo data:', err)
      setErrorMsg('An unexpected error occurred')
      setTimeout(() => setErrorMsg(null), 4000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Glowing animated halo background */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 opacity-75 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse" />
      
      <button
        type="button"
        onClick={handleInject}
        disabled={isLoading || isSuccess}
        className="relative group inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer w-full sm:w-auto"
        title="Inject sample New Balance sales metrics (2022-2025 baseline & recent 15-day pace) instantly into this organization"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            <span className="tracking-wide">Injecting Demo Sales Data...</span>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-300 animate-bounce" />
            <span className="tracking-wide">Demo Data Injected & Reloaded!</span>
          </>
        ) : errorMsg ? (
          <span className="text-rose-200">{errorMsg}</span>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-pink-300 animate-bounce group-hover:scale-125 transition-transform" />
            <span className="tracking-wide uppercase font-black">Inject Demo Data</span>
          </>
        )}
      </button>
    </div>
  )
}

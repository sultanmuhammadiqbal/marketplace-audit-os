'use client'

import React, { useState } from 'react'
import { processEtlUpload, resolveMappingsAndCommit, MasterProduct, NormalizedEtlRow, MappingResolutionItem } from '@/server/actions/etl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowRight, Loader2, Sparkles, Database, ShoppingBag, Radio } from 'lucide-react'
import { InjectDemoDataButton } from '@/components/dashboard/inject-demo-data-button'

interface UploadClientProps {
  organizationId: string
  uploadStatus: {
    uploadCount: number
    limit: number
    isLimitReached: boolean
    organizationName: string
  }
  initialMasterProducts: MasterProduct[]
}

export function UploadClient({ organizationId, uploadStatus: initialStatus, initialMasterProducts }: UploadClientProps) {
  const [platform, setPlatform] = useState<'Shopee' | 'TikTok'>('Shopee')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(initialStatus)
  const [masterProducts, setMasterProducts] = useState(initialMasterProducts)

  // Smart Mapping Modal state
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false)
  const [unrecognizedProducts, setUnrecognizedProducts] = useState<string[]>([])
  const [pendingRows, setPendingRows] = useState<NormalizedEtlRow[]>([])
  const [resolutions, setResolutions] = useState<Record<string, { mode: 'existing' | 'new'; value: string }>>({})
  const [isCommitting, setIsCommitting] = useState(false)

  // Success summary state
  const [successData, setSuccessData] = useState<{ rowsProcessed: number; uploadCount: number } | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (uploadStatus.isLimitReached) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0]
      validateAndSetFile(selectedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast.error('Invalid format. Only .xlsx, .xls, or .csv advertising reports are supported.')
      return
    }
    setFile(selectedFile)
    setSuccessData(null)
  }

  const handleUploadSubmit = async () => {
    if (!file) {
      toast.error('Please select an Excel or CSV report file to ingest.')
      return
    }

    if (uploadStatus.isLimitReached) {
      toast.error('Freemium upload quota reached. Maximum 3 uploads allowed in trial.')
      return
    }

    setIsProcessing(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('platform', platform)
    formData.append('organizationId', organizationId)

    try {
      const res = await processEtlUpload(formData)
      
      if (res.status === 'REQUIRES_MAPPING' && res.unrecognizedProducts && res.normalizedRows) {
        setUnrecognizedProducts(res.unrecognizedProducts)
        setPendingRows(res.normalizedRows)
        // Default resolutions: auto-propose cleaned capitalized string for each as a "new" master product
        const defaultResolutions: Record<string, { mode: 'existing' | 'new'; value: string }> = {}
        res.unrecognizedProducts.forEach((prodName) => {
          const cleaned = prodName
            .replace(/[_-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase())
          defaultResolutions[prodName] = { mode: 'new', value: cleaned }
        })
        setResolutions(defaultResolutions)
        setIsMappingModalOpen(true)
        toast.info(`Discovered ${res.unrecognizedProducts.length} unmapped product items. Smart mapping required!`)
      } else if (res.status === 'SUCCESS' && res.summary) {
        setSuccessData(res.summary)
        setUploadStatus((prev) => ({
          ...prev,
          uploadCount: res.summary!.uploadCount,
          isLimitReached: res.summary!.uploadCount >= prev.limit
        }))
        toast.success('ETL pipeline executed successfully! Data normalized and UPSERTed.')
        setFile(null)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error processing dataset during ETL import.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResolutionChange = (originalName: string, mode: 'existing' | 'new', value: string) => {
    setResolutions((prev) => ({
      ...prev,
      [originalName]: { mode, value }
    }))
  }

  const handleCommitMappings = async () => {
    setIsCommitting(true)
    try {
      const formattedResolutions: MappingResolutionItem[] = unrecognizedProducts.map((original) => {
        const res = resolutions[original] || { mode: 'new', value: original }
        return {
          originalName: original,
          targetMasterIdOrName: res.value,
          isNewMaster: res.mode === 'new'
        }
      })

      const res = await resolveMappingsAndCommit(organizationId, platform, formattedResolutions, pendingRows)
      if (res.status === 'SUCCESS' && res.summary) {
        setIsMappingModalOpen(false)
        setSuccessData(res.summary)
        setUploadStatus((prev) => ({
          ...prev,
          uploadCount: res.summary!.uploadCount,
          isLimitReached: res.summary!.uploadCount >= prev.limit
        }))
        toast.success('Mappings saved to database & ETL records committed successfully!')
        setFile(null)

        // Update local master products list with newly created items
        const addedMasters: MasterProduct[] = formattedResolutions
          .filter((f) => f.isNewMaster)
          .map((f, idx) => ({ id: `new-${Date.now()}-${idx}`, master_name: f.targetMasterIdOrName }))
        setMasterProducts((prev) => [...prev, ...addedMasters])
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resolve mappings and save records.')
      console.error(err)
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Trial Quota Tracker Banner */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-muted/30 p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20 shadow-inner">
            <Database className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-foreground">Freemium Sandbox Quota</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider border ${uploadStatus.isLimitReached ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>
                {uploadStatus.isLimitReached ? 'Trial Limit Reached' : 'Active Trial'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-semibold mt-0.5">
              Organization: <span className="text-foreground font-bold">{uploadStatus.organizationName}</span> • Using smart deduplication UPSERT engine
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <InjectDemoDataButton organizationId={organizationId} />
          <div className="flex items-center gap-3 bg-muted/60 px-5 py-3 rounded-2xl border border-border/60">
            <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide">Uploads:</span>
            <span className="text-2xl font-black text-primary tracking-tight">
              {uploadStatus.uploadCount} <span className="text-sm font-bold text-muted-foreground/80">/ {uploadStatus.limit}</span>
            </span>
          </div>
        </div>
      </div>

      {uploadStatus.isLimitReached && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent border border-rose-500/30 text-foreground flex items-center gap-4 shadow-xl">
          <AlertTriangle className="h-8 w-8 text-rose-500 shrink-0 animate-bounce" />
          <div>
            <h4 className="font-extrabold text-lg text-rose-600 dark:text-rose-400">Free Trial Limit Reached</h4>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              You have exhausted the maximum limit of 3 trial file uploads for this organization. Upgrade your subscription or perform a database reset to run new test pipelines.
            </p>
          </div>
        </div>
      )}

      {/* Success Scorecard Display */}
      {successData && (
        <Card className="rounded-3xl border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-card shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
          <CardHeader className="flex flex-col items-center justify-center text-center p-8 pb-4">
            <div className="h-16 w-16 rounded-3xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4 shadow-lg border border-emerald-500/30">
              <CheckCircle className="h-9 w-9 stroke-[2.5]" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              ETL Pipeline Completed!
            </CardTitle>
            <CardDescription className="text-base font-semibold text-muted-foreground max-w-lg mt-2">
              Your platform advertising dataset has been cleanly normalized, product names smart-mapped, and historical metrics UPSERTed without duplicate collisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-6 pb-8">
            <div className="flex items-center gap-8 bg-background/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-border/80 shadow-md">
              <div className="text-center">
                <p className="text-xs font-extrabold uppercase text-muted-foreground">Rows Ingestion</p>
                <p className="text-3xl font-black text-foreground mt-1">{successData.rowsProcessed}</p>
              </div>
              <div className="h-10 w-px bg-border/80" />
              <div className="text-center">
                <p className="text-xs font-extrabold uppercase text-muted-foreground">Remaining Quota</p>
                <p className="text-3xl font-black text-primary mt-1">{Math.max(0, uploadStatus.limit - successData.uploadCount)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setSuccessData(null)}
              className="rounded-2xl px-6 py-5 font-bold border-border shadow-sm hover:scale-105 transition-all"
            >
              Upload Another Campaign Sheet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Upload Configuration Deck */}
      {!successData && (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${uploadStatus.isLimitReached ? 'opacity-60 pointer-events-none' : ''}`}>
          {/* Platform Selector Panel */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold uppercase tracking-wider text-muted-foreground px-1">1. Select Target Platform</h3>
            <div className="grid grid-cols-1 gap-4">
              <div
                onClick={() => setPlatform('Shopee')}
                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${platform === 'Shopee' ? 'border-orange-500 bg-gradient-to-r from-orange-500/15 via-orange-500/5 to-card shadow-lg scale-[1.02]' : 'border-border/60 bg-card hover:border-orange-500/40 hover:bg-muted/30'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl transition-transform group-hover:scale-105 ${platform === 'Shopee' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-muted text-muted-foreground'}`}>
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-extrabold text-lg text-foreground">Shopee Ads</p>
                    <p className="text-xs text-muted-foreground font-semibold">Omzet, Biaya Iklan & Dilihat</p>
                  </div>
                </div>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${platform === 'Shopee' ? 'border-orange-500 bg-orange-500 text-white' : 'border-muted-foreground/30'}`}>
                  {platform === 'Shopee' && <CheckCircle className="h-4 w-4" />}
                </div>
              </div>

              <div
                onClick={() => setPlatform('TikTok')}
                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${platform === 'TikTok' ? 'border-indigo-500 bg-gradient-to-r from-indigo-500/15 via-purple-500/5 to-card shadow-lg scale-[1.02]' : 'border-border/60 bg-card hover:border-indigo-500/40 hover:bg-muted/30'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl transition-transform group-hover:scale-105 ${platform === 'TikTok' ? 'bg-gradient-to-br from-indigo-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-muted text-muted-foreground'}`}>
                    <Radio className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-extrabold text-lg text-foreground">TikTok Shop Ads</p>
                    <p className="text-xs text-muted-foreground font-semibold">Cost, GMV & Impressions</p>
                  </div>
                </div>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${platform === 'TikTok' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-muted-foreground/30'}`}>
                  {platform === 'TikTok' && <CheckCircle className="h-4 w-4" />}
                </div>
              </div>
            </div>
          </div>

          {/* Dropzone Deck */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-base font-extrabold uppercase tracking-wider text-muted-foreground px-1">2. Upload Campaign File</h3>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-3xl border-2 border-dashed transition-all duration-300 p-8 text-center flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden group ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : file ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-border/80 bg-card/50 hover:bg-card hover:border-primary/60'}`}
            >
              <input
                type="file"
                id="etl-upload-file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={uploadStatus.isLimitReached || isProcessing}
              />
              
              {file ? (
                <div className="space-y-4 max-w-md animate-in fade-in duration-200">
                  <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30 shadow-md">
                    <FileSpreadsheet className="h-9 w-9" />
                  </div>
                  <div>
                    <p className="font-black text-lg text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-wider mt-1">
                      {(file.size / 1024).toFixed(1)} KB • {platform} Format Verified
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="rounded-xl font-bold border-border/80"
                      disabled={isProcessing}
                    >
                      Remove File
                    </Button>
                    <Button
                      onClick={handleUploadSubmit}
                      disabled={isProcessing || uploadStatus.isLimitReached}
                      className="rounded-xl font-black shadow-xl shadow-primary/20 px-6 bg-gradient-to-r from-primary to-primary/90 hover:scale-105 active:scale-95 transition-all"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingesting Data...
                        </>
                      ) : (
                        <>
                          Run ETL Ingestion <ArrowRight className="ml-2 h-4 w-4 stroke-[3]" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="etl-upload-file" className="cursor-pointer w-full h-full flex flex-col items-center justify-center space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-lg text-foreground">
                      Drag & Drop advertising report here, or <span className="text-primary underline decoration-2">browse files</span>
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground max-w-sm mx-auto">
                      Supports Excel (.xlsx, .xls) and CSV exports directly from Seller Center ads dashboard.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-muted/80 text-muted-foreground border border-border">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Auto-UPSERT deduplication active
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Smart Mapping Modal */}
      <Dialog open={isMappingModalOpen} onOpenChange={setIsMappingModalOpen}>
        <DialogContent className="max-w-4xl rounded-3xl border border-border/80 bg-background/90 backdrop-blur-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 pb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center font-black shadow-sm">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
                  Smart Product Mapping
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Action Required: {unrecognizedProducts.length} Unrecognized Product Names Discovered
                </DialogDescription>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground pt-1">
              To keep your advertising analytics pristine, please link these messy platform product titles to an existing master catalog item or define a new clean master name. Once mapped, future uploads will be recognized automatically!
            </p>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[420px] overflow-y-auto pr-2">
            {unrecognizedProducts.map((original, idx) => {
              const currentRes = resolutions[original] || { mode: 'new', value: original }
              return (
                <div key={idx} className="p-4 rounded-2xl border border-border/80 bg-card/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-muted text-muted-foreground uppercase border border-border/60">
                        {platform} Raw Title
                      </span>
                    </div>
                    <p className="text-base font-black text-foreground truncate">{original}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Selector Switcher for New vs Existing */}
                    <div className="flex p-1 rounded-xl bg-muted/80 border border-border/60 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleResolutionChange(original, 'new', resolutions[original]?.value || original)}
                        className={`flex-1 sm:flex-initial px-3 py-1 text-xs font-black rounded-lg transition-all ${currentRes.mode === 'new' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        New Master
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const firstMaster = masterProducts[0]?.id || ''
                          handleResolutionChange(original, 'existing', firstMaster)
                        }}
                        disabled={masterProducts.length === 0}
                        className={`flex-1 sm:flex-initial px-3 py-1 text-xs font-black rounded-lg transition-all ${currentRes.mode === 'existing' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground disabled:opacity-40'}`}
                      >
                        Link Existing
                      </button>
                    </div>

                    {/* Input or Dropdown based on mode */}
                    <div className="w-full sm:w-64">
                      {currentRes.mode === 'new' ? (
                        <input
                          type="text"
                          value={currentRes.value}
                          onChange={(e) => handleResolutionChange(original, 'new', e.target.value)}
                          placeholder="Type clean master brand name..."
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                        />
                      ) : (
                        <select
                          value={currentRes.value}
                          onChange={(e) => handleResolutionChange(original, 'existing', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
                        >
                          {masterProducts.map((mp) => (
                            <option key={mp.id} value={mp.id}>
                              {mp.master_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="pt-4 border-t border-border/40 flex flex-row items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setIsMappingModalOpen(false)}
              disabled={isCommitting}
              className="rounded-xl font-bold text-muted-foreground hover:text-foreground"
            >
              Cancel Import
            </Button>
            <Button
              onClick={handleCommitMappings}
              disabled={isCommitting}
              className="rounded-2xl font-black px-8 py-6 shadow-2xl shadow-primary/25 bg-gradient-to-r from-primary via-primary to-primary/90 hover:scale-105 active:scale-95 transition-all text-base"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving & Committing Analytics...
                </>
              ) : (
                <>
                  Save Mappings & Commit Analytics <CheckCircle className="ml-2 h-5 w-5 stroke-[3]" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveAuditAnswer, calculateAndCompleteAudit } from '@/server/actions/audits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, ArrowRight, AlertTriangle, Calculator, FileText, MessageSquare, BarChart3, TrendingUp, Sparkles, ShieldAlert } from 'lucide-react'
import { createFinding } from '@/server/actions/findings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export function ChecklistClient({ auditData }: { auditData: any }) {
  const router = useRouter()
  const { audit, modules, answers: initialAnswers } = auditData
  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id)
  const [answers, setAnswers] = useState<any[]>(initialAnswers || [])
  const [isCompleting, setIsCompleting] = useState(false)

  const activeModule = modules.find((m: any) => m.id === activeModuleId)

  // Find the answer for a specific question
  const getAnswer = (questionId: string) => {
    return answers.find(a => a.question_id === questionId)
  }

  const handleSaveAnswer = async (questionId: string, value: string, notes?: string) => {
    // Optimistic update
    const newAnswer = { audit_id: audit.id, question_id: questionId, answer_value: value, notes: notes || '' }
    setAnswers(prev => {
      const existing = prev.findIndex(a => a.question_id === questionId)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = newAnswer
        return next
      }
      return [...prev, newAnswer]
    })

    try {
      const result = await saveAuditAnswer(audit.id, questionId, value, notes)
      if (!result.success) {
        throw new Error(result.error)
      }
      toast.success('Evaluasi kriteria tersimpan')
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan evaluasi')
    }
  }

  const handleNotesChange = (questionId: string, notes: string) => {
    const existing = getAnswer(questionId)
    if (existing && existing.answer_value) {
      handleSaveAnswer(questionId, existing.answer_value, notes)
    }
  }

  const handleCompleteAudit = async () => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan audit dan mengalkulasi skor akhir? Evaluasi yang sudah dikunci tidak dapat diubah kembali.')) return
    
    setIsCompleting(true)
    try {
      await calculateAndCompleteAudit(audit.id)
      toast.success('Audit berhasil diselesaikan!')
      router.push(`/dashboard/audits/${audit.id}/summary`)
    } catch (error: any) {
      toast.error(error.message || 'Gagal memvalidasi dan menyelesaikan audit')
      setIsCompleting(false)
    }
  }

  const isCompleted = audit.status === 'completed'

  // Total questions count and answered count across all modules
  const totalQuestions = modules.reduce((acc: number, m: any) => acc + (m.questions?.length || 0), 0)
  const totalAnswered = modules.reduce((acc: number, m: any) => {
    return acc + (m.questions?.filter((q: any) => getAnswer(q.id)?.answer_value).length || 0)
  }, 0)
  const overallProgress = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-13rem)] border border-border/70 rounded-2xl overflow-hidden shadow-lg bg-card">
      {/* Sidebar - Analytical Module Navigation */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border/60 bg-muted/20 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span>Modul Diagnosis & Audit</span>
            </h3>
            <p className="text-xs text-muted-foreground">Pilih modul di bawah untuk mengecek indikator performa.</p>
          </div>

          {/* Module list with progress bars */}
          <div className="space-y-2.5">
            {modules.map((module: any) => {
              const qCount = module.questions?.length || 0
              const aCount = module.questions?.filter((q: any) => getAnswer(q.id)?.answer_value).length || 0
              const isModuleComplete = qCount > 0 && qCount === aCount
              const isActive = activeModuleId === module.id
              const progressPct = qCount > 0 ? Math.round((aCount / qCount) * 100) : 0

              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModuleId(module.id)}
                  className={`w-full group text-left p-4 rounded-xl transition-all duration-200 border relative overflow-hidden ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md border-primary scale-[1.01]' 
                      : 'bg-background/80 hover:bg-muted/60 text-foreground border-border/60 hover:border-border shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`font-semibold text-sm truncate block ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {module.name}
                    </span>
                    {isModuleComplete ? (
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                    ) : (
                      <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-primary-foreground/20 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {aCount}/{qCount}
                      </span>
                    )}
                  </div>

                  {/* Micro Progress Bar for Module */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        isActive ? 'bg-white' : isModuleComplete ? 'bg-emerald-500' : 'bg-primary/70'
                      }`} 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Overall Audit Summary Panel in Sidebar */}
        <div className="mt-6 pt-4 border-t border-border/50 space-y-2 bg-background/50 -mx-2 -mb-2 p-3.5 rounded-xl border">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Progres Keseluruhan
            </span>
            <span className="font-mono font-bold text-primary">{overallProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            {totalAnswered} dari {totalQuestions} kriteria telah dianalisis
          </p>
        </div>
      </div>

      {/* Main Panel - Analytical Checklist Items */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 bg-background relative">
        {activeModule ? (
          <div className="max-w-4xl mx-auto w-full space-y-6 pb-28">
            {/* Module Title Banner */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 via-muted/30 to-transparent p-5 rounded-xl border border-border/60">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 block">Modul Aktif</span>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{activeModule.name}</h2>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs text-muted-foreground block">Kelengkapan Modul</span>
                <span className="text-xl font-mono font-bold text-foreground">
                  {activeModule.questions?.filter((q: any) => getAnswer(q.id)?.answer_value).length || 0} / {activeModule.questions?.length || 0}
                </span>
              </div>
            </div>
            
            {/* Question Items */}
            <div className="space-y-6">
              {activeModule.questions?.map((question: any, idx: number) => {
                const answer = getAnswer(question.id)
                const hasAnswer = !!answer?.answer_value
                const isPass = answer?.answer_value === 'pass'
                const isFail = answer?.answer_value === 'fail'
                
                // Determine accent edge color
                let accentBorder = 'border-l-4 border-l-slate-300 dark:border-l-slate-700'
                if (isPass) accentBorder = 'border-l-4 border-l-emerald-500'
                else if (isFail) accentBorder = 'border-l-4 border-l-rose-500'
                else if (hasAnswer) accentBorder = 'border-l-4 border-l-blue-500'

                return (
                  <Card 
                    key={question.id} 
                    className={`border border-border/80 rounded-xl transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden bg-card ${accentBorder} ${hasAnswer ? 'bg-accent/5' : ''}`}
                  >
                    <CardHeader className="pb-4 pt-5 px-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3 items-start flex-1">
                          <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-foreground text-xs font-mono font-bold mt-0.5">
                            #{idx + 1}
                          </span>
                          <CardTitle className="text-base font-semibold leading-relaxed text-foreground">
                            {question.question_text}
                          </CardTitle>
                        </div>
                        <div className="shrink-0">
                          {hasAnswer ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-3 py-1 font-semibold text-xs rounded-full flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai Evaluasi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground font-medium text-xs rounded-full px-3 py-1">
                              Belum Evaluasi
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-6 pt-0 space-y-5">
                      {/* Interactive Answer Elements based on type */}
                      {question.question_type === 'pass_fail' && (
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                          <Button 
                            variant={isPass ? 'default' : 'outline'}
                            className={`h-12 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5 ${
                              isPass 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600/30' 
                                : 'hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                            }`}
                            onClick={() => !isCompleted && handleSaveAnswer(question.id, 'pass', answer?.notes)}
                            disabled={isCompleted}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Lolos (Memenuhi SOP)
                          </Button>
                          <Button 
                            variant={isFail ? 'destructive' : 'outline'}
                            className={`h-12 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5 ${
                              isFail 
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm ring-2 ring-rose-600/30' 
                                : 'hover:bg-rose-50 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:border-rose-500/60'
                            }`}
                            onClick={() => !isCompleted && handleSaveAnswer(question.id, 'fail', answer?.notes)}
                            disabled={isCompleted}
                          >
                            <XCircle className="w-5 h-5" />
                            Gagal (Perlu Perbaikan)
                          </Button>
                        </div>
                      )}

                      {question.question_type === 'scale' && (
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                            Skor Evaluasi (1 = Kritis, 5 = Sangat Baik)
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {[1, 2, 3, 4, 5].map(score => {
                              const isSelected = answer?.answer_value === String(score)
                              let scoreBg = 'bg-primary'
                              if (score === 1 || score === 2) scoreBg = 'bg-rose-600'
                              if (score === 3) scoreBg = 'bg-amber-500'
                              if (score === 4 || score === 5) scoreBg = 'bg-emerald-600'

                              return (
                                <Button
                                  key={score}
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={() => !isCompleted && handleSaveAnswer(question.id, String(score), answer?.notes)}
                                  disabled={isCompleted}
                                  className={`w-14 h-12 rounded-xl text-base font-bold font-mono transition-all ${
                                    isSelected ? `${scoreBg} text-white shadow-md scale-105` : 'hover:bg-muted border-border/80'
                                  }`}
                                >
                                  {score}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {question.question_type === 'text' && (
                        <Textarea 
                          placeholder="Tuliskan analisis atau pengamatan detail untuk parameter ini..."
                          value={answer?.answer_value || ''}
                          onChange={(e: any) => {
                             if(isCompleted) return;
                             handleSaveAnswer(question.id, e.target.value, answer?.notes)
                          }}
                          disabled={isCompleted}
                          className="min-h-[80px] rounded-xl border-border/80 text-sm focus-visible:ring-primary/50"
                        />
                      )}

                      {/* Integrated Analytical Footer: Flag Issue directly below answer block */}
                      <div className="pt-4 mt-2 border-t border-border/50 bg-muted/10 -mx-6 -mb-6 p-6 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <MessageSquare className="h-4 w-4 text-primary/70" />
                            <span>Catatan Evaluasi & Pelaporan Kendala</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FlagIssueDialog audit={audit} question={question} />
                          </div>
                        </div>

                        <Textarea 
                          placeholder="Tambahkan catatan analisis, saran optimasi, atau keterangan eviden untuk laporan (opsional)..." 
                          className="text-sm min-h-[70px] bg-background/80 border-border/70 rounded-xl focus-visible:ring-primary/40 placeholder:text-muted-foreground/60"
                          defaultValue={answer?.notes || ''}
                          onBlur={(e: any) => {
                            if(!isCompleted && answer?.answer_value) {
                              handleNotesChange(question.id, e.target.value)
                            }
                          }}
                          disabled={isCompleted || !answer?.answer_value}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3 my-auto">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 stroke-[1.5]" />
            <p className="text-base font-medium">Pilih modul di panel kiri untuk memulai evaluasi toko.</p>
          </div>
        )}

        {/* Floating Analytical Footer Bar */}
        <div className="fixed md:absolute bottom-0 left-0 right-0 p-4 px-6 bg-background/90 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center justify-between z-10">
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
            <span className="font-bold text-foreground">Status Audit:</span>
            {!isCompleted ? 'Dalam proses diagnosis oleh praktisi e-commerce' : 'Audit telah dikalkulasi & ditandatangani'}
          </div>
          <div className="flex justify-end w-full sm:w-auto">
            {!isCompleted ? (
              <Button 
                onClick={handleCompleteAudit} 
                disabled={isCompleting} 
                size="lg" 
                className="w-full sm:w-auto font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-md hover:shadow-lg transition-all text-primary-foreground gap-2 h-12 px-6"
              >
                <Calculator className="h-4 w-4" />
                {isCompleting ? 'Mengingat & Mengalkulasi Skor...' : 'Selesaikan & Hitung Skor Akhir'}
              </Button>
            ) : (
              <Button 
                onClick={() => router.push(`/dashboard/audits/${audit.id}/summary`)} 
                size="lg"
                className="w-full sm:w-auto font-semibold rounded-xl bg-primary shadow-md gap-2 h-12 px-6"
              >
                <FileText className="h-4 w-4" />
                Lihat Scorecard & Ekspor PDF
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FlagIssueDialog({ audit, question }: { audit: any, question: any }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Medium')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createFinding({
        organization_id: audit.organization_id,
        audit_id: audit.id,
        audit_question_id: question.id,
        title,
        description,
        severity
      })
      toast.success('Temuan masalah berhasil dicatat ke laporan!')
      setOpen(false)
      setTitle('')
      setDescription('')
      setSeverity('Medium')
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan temuan masalah')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/50 font-semibold text-xs px-3.5 py-2 h-9 rounded-lg transition-all flex items-center gap-2 shadow-2xs"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Laporkan Temuan Masalah (Flag Issue)</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border border-border/80 shadow-2xl max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-base">
            <ShieldAlert className="h-5 w-5" />
            <span>Laporkan Temuan Masalah & Pelanggaran SOP</span>
          </div>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Temuan yang dicatat pada kriteria <strong>&ldquo;{question.question_text}&rdquo;</strong> akan dimasukkan ke dalam daftar prioritas perbaikan (Findings Dashboard) dan terangkum di dalam Laporan Akhir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Judul Temuan / Masalah</label>
            <Input 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Contoh: Judul belum mengandung kata kunci utama di 5 kata pertama" 
              className="rounded-xl h-11 border-border/80 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Deskripsi Detail & Eviden</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Jelaskan bukti pengamatan atau tangkapan layar terkait ketidaksesuaian ini..." 
              className="rounded-xl min-h-[90px] border-border/80 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Tingkat Keparahan & Prioritas</label>
            <select 
              value={severity} 
              onChange={e => setSeverity(e.target.value as any)}
              className="flex h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="Critical">Kritis (Critical) - Dampak Fatal terhadap Traffic/Sales</option>
              <option value="High">Tinggi (High) - Prioritas Perbaikan Segera</option>
              <option value="Medium">Menengah (Medium) - Optimasi Menengah</option>
              <option value="Low">Rendah (Low) - Saran Perbaikan Minor</option>
            </select>
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan ke Sistem...' : 'Simpan Temuan ke Laporan Audit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

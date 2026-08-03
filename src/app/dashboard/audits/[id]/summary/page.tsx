import { getAuditSummary } from '@/server/actions/audits'
import { getFindingsByAudit } from '@/server/actions/findings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert, ShieldCheck, Shield, AlertTriangle, XCircle, Store, Calendar, Award, FileText, CheckCircle2 } from 'lucide-react'
import { ExportButton } from '@/components/shared/export-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'Critical':
      return <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-semibold print:bg-rose-600 print:text-white">Kritis (Critical)</Badge>
    case 'High':
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold print:bg-orange-500 print:text-white">Tinggi (High)</Badge>
    case 'Medium':
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold print:bg-amber-400 print:text-black">Menengah (Medium)</Badge>
    case 'Low':
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-semibold print:bg-blue-500 print:text-white">Rendah (Low)</Badge>
    default:
      return <Badge>{severity}</Badge>
  }
}

export default async function AuditSummaryPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const [{ audit, moduleResults }, findings] = await Promise.all([
    getAuditSummary(resolvedParams.id),
    getFindingsByAudit(resolvedParams.id)
  ])

  const score = audit.overall_score || 0
  
  // Determine Risk Category & Diagnostic Summary
  let category = 'Kritis (Critical)'
  let color = 'text-rose-600 dark:text-rose-400 print:text-rose-700'
  let bgColor = 'bg-rose-500/10 border-rose-500/30 print:bg-rose-50 print:border-rose-300'
  let Icon = XCircle
  let diagnosticSummary = 'Performa toko berada di level berisiko fatal terhadap hilangnya rasio konversi dan penalti algoritma pencarian. Diperlukan intervensi segera pada kriteria bertanda kritis.'

  if (score >= 90) {
    category = 'Sangat Optimal (Excellent)'
    color = 'text-emerald-600 dark:text-emerald-400 print:text-emerald-700'
    bgColor = 'bg-emerald-500/10 border-emerald-500/30 print:bg-emerald-50 print:border-emerald-300'
    Icon = ShieldCheck
    diagnosticSummary = 'Struktur SEO, kelengkapan visual persuasif, serta konfigurasi promo toko sudah sangat memenuhi SOP best-practice marketplace modern. Lakukan pemeliharaan konsisten.'
  } else if (score >= 80) {
    category = 'Kondisi Sehat (Healthy)'
    color = 'text-blue-600 dark:text-blue-400 print:text-blue-700'
    bgColor = 'bg-blue-500/10 border-blue-500/30 print:bg-blue-50 print:border-blue-300'
    Icon = Shield
    diagnosticSummary = 'Secara umum performa toko sehat dan terindeks dengan baik, namun terdapat beberapa area optimasi minor yang dapat didongkrak untuk mengalahkan kompetitor ulasan teratas.'
  } else if (score >= 70) {
    category = 'Perlu Perbaikan (Needs Improvement)'
    color = 'text-amber-600 dark:text-amber-400 print:text-amber-700'
    bgColor = 'bg-amber-500/10 border-amber-500/30 print:bg-amber-50 print:border-amber-300'
    Icon = AlertTriangle
    diagnosticSummary = 'Terdapat beberapa kelemahan pada presentasi produk dan optimasi kata kunci yang menghambat potensi konversi organik. Segera jalankan perbaikan pada temuan berprioritas tinggi.'
  } else if (score >= 60) {
    category = 'Berisiko Tinggi (High Risk)'
    color = 'text-orange-600 dark:text-orange-400 print:text-orange-700'
    bgColor = 'bg-orange-500/10 border-orange-500/30 print:bg-orange-50 print:border-orange-300'
    Icon = ShieldAlert
    diagnosticSummary = 'Toko berisiko mengalami kebocoran anggaran iklan dan CTR rendah akibat kualitas visual atau judul produk yang belum terkonfigura sesuai formula algoritma E-commerce.'
  }

  const auditDate = new Date(audit.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 print:max-w-none print:w-full print:bg-white print:text-black print:p-0 print:space-y-6">
      {/* Agency Header - Highly customized for both professional web view & high-end PDF report */}
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/audits">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shadow-2xs hover:bg-muted transition-all">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-semibold text-xs rounded-full uppercase tracking-widest">
              Laporan Hasil Diagnosis
            </Badge>
          </div>
          <ExportButton />
        </div>

        {/* High-End Agency Cover Banner (Appears stylish on Web & Promiseworthy in PDF) */}
        <div className="border-b border-border/70 pb-6 print:border-gray-300 print:pb-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-muted-foreground uppercase tracking-widest print:text-gray-500">
            <span>MARKETPLACE AUDIT OS • E-COMMERCE GROWTH CONSULTING</span>
            <span>DOKUMEN RAHASIA / EXCLUSIVE REPORT</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground print:text-black">
                Scorecard & Laporan Diagnosis Audit
              </h1>
              <p className="text-base text-muted-foreground print:text-gray-600 font-medium">
                Evaluasi Mendalam untuk Peningkatan Konversi & Algoritma Marketplace
              </p>
            </div>
            
            {/* Metadata Grid */}
            <div className="flex flex-wrap gap-4 bg-muted/30 print:bg-gray-50 p-4 rounded-xl border border-border/50 print:border-gray-200 text-xs text-muted-foreground">
              <div>
                <span className="block font-semibold uppercase text-[10px] tracking-wider">Target Toko</span>
                <span className="font-bold text-foreground print:text-black text-sm">{audit.store?.name || 'Toko Marketplace'}</span>
              </div>
              <div className="border-l border-border/60 pl-4 print:border-gray-300">
                <span className="block font-semibold uppercase text-[10px] tracking-wider">Platform</span>
                <span className="font-bold text-foreground print:text-black text-sm uppercase">{audit.store?.platform || 'Shopee & TikTok'}</span>
              </div>
              <div className="border-l border-border/60 pl-4 print:border-gray-300">
                <span className="block font-semibold uppercase text-[10px] tracking-wider">Tanggal Audit</span>
                <span className="font-bold text-foreground print:text-black text-sm">{auditDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scorecard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:gap-4">
        {/* Overall Score Box */}
        <Card className={`col-span-1 md:col-span-3 border-2 rounded-2xl overflow-hidden shadow-lg ${bgColor} print:shadow-none print:border-2 print:rounded-xl print:break-inside-avoid`}>
          <CardContent className="p-8 print:p-6 flex flex-col md:flex-row items-center justify-between gap-8 print:gap-6">
            <div className="flex items-center gap-6 print:gap-4">
              <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-border/50 print:bg-white print:border-gray-200 ${color} shrink-0`}>
                <Icon className="h-14 w-14 print:h-12 print:w-12" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground print:text-gray-600 block">
                  Status Kesehatan Toko (Overall Health)
                </span>
                <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${color}`}>
                  {category}
                </h2>
                <p className="text-xs md:text-sm font-medium text-foreground/80 print:text-gray-700 max-w-xl leading-relaxed pt-1">
                  <strong>Analisis Eksektif: </strong>{diagnosticSummary}
                </p>
              </div>
            </div>
            
            <div className="text-center md:text-right bg-background/80 print:bg-white p-6 rounded-2xl border border-border/60 print:border-gray-200 shadow-2xs shrink-0 w-full md:w-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground print:text-gray-600 block mb-1">
                Skor Evaluasi Akhir
              </span>
              <div className="flex items-baseline justify-center md:justify-end gap-1 font-mono">
                <span className={`text-6xl print:text-5xl font-black ${color}`}>
                  {Number(score).toFixed(0)}
                </span>
                <span className="text-2xl print:text-xl text-muted-foreground font-bold">/100</span>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground block mt-2 print:text-gray-500">
                Terverifikasi secara Algoritmis
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Module Breakdowns */}
        <div className="col-span-1 md:col-span-3 space-y-4 pt-2 print:pt-0">
          <div className="flex items-center justify-between border-b border-border/50 pb-2 print:border-gray-200">
            <h3 className="text-xl font-bold tracking-tight text-foreground print:text-black flex items-center gap-2">
              <Award className="h-5 w-5 text-primary print:text-black" />
              <span>Rincian Evaluasi per Modul Parameter</span>
            </h3>
            <span className="text-xs font-semibold text-muted-foreground print:text-gray-500">
              {moduleResults.length} Modul Diuji
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:grid-cols-3 print:gap-3">
            {moduleResults.map((result: any) => {
              const perc = Number(result.percentage_score) || 0
              let barColor = 'bg-rose-500'
              let textColor = 'text-rose-600'
              if (perc >= 90) { barColor = 'bg-emerald-500'; textColor = 'text-emerald-600' }
              else if (perc >= 80) { barColor = 'bg-blue-500'; textColor = 'text-blue-600' }
              else if (perc >= 70) { barColor = 'bg-amber-500'; textColor = 'text-amber-600' }
              else if (perc >= 60) { barColor = 'bg-orange-500'; textColor = 'text-orange-600' }

              return (
                <Card key={result.id} className="border border-border/80 rounded-xl shadow-sm print:shadow-none print:border-gray-300 print:break-inside-avoid bg-card overflow-hidden">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm font-bold leading-snug print:text-black text-foreground">
                        {result.module?.name}
                      </CardTitle>
                      <span className={`font-mono font-extrabold text-lg ${textColor} print:text-black`}>
                        {perc.toFixed(0)}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-4 pt-0">
                    <div className="space-y-2.5">
                      <div className="w-full bg-muted print:bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full ${barColor} transition-all duration-500 !print:color-adjust-exact`} 
                          style={{ width: `${perc}%`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-semibold text-muted-foreground print:text-gray-600 border-t border-border/40 print:border-gray-100 pt-2">
                        <span>Skor Didapat: <strong className="text-foreground print:text-black">{result.earned_score}</strong></span>
                        <span>Maksimal: <strong className="text-foreground print:text-black">{result.max_score}</strong></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Findings List - Detailed Diagnostic Findings */}
        <div className="col-span-1 md:col-span-3 pt-6 print:pt-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2 print:border-gray-200">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground print:text-black flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 print:text-black" />
                <span>Daftar Temuan & Analisis Masalah ({findings.length})</span>
              </h3>
              <p className="text-xs text-muted-foreground print:text-gray-600 mt-0.5">
                Prioritalkan perbaikan pada kendala berlabel Kritis dan Tinggi untuk hasil peningkatan penjualan yang instan.
              </p>
            </div>
            <Badge variant="outline" className="font-mono font-semibold text-xs print:border-gray-300">
              Total Temuan: {findings.length}
            </Badge>
          </div>
          
          <Card className="border border-border/80 rounded-xl shadow-sm print:shadow-none print:border-gray-300 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50 print:bg-gray-100">
                  <TableRow className="print:border-gray-300 hover:bg-transparent">
                    <TableHead className="font-bold text-xs text-foreground uppercase tracking-wider print:text-black w-1/4">Kriteria Audit & SOP</TableHead>
                    <TableHead className="font-bold text-xs text-foreground uppercase tracking-wider print:text-black w-2/5">Detail Temuan & Saran Optimasi</TableHead>
                    <TableHead className="font-bold text-xs text-foreground uppercase tracking-wider print:text-black w-[15%] text-center">Prioritas</TableHead>
                    <TableHead className="font-bold text-xs text-foreground uppercase tracking-wider print:text-black w-[15%] text-center">Status Temuan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {findings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground print:text-gray-600">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                          <span className="font-semibold text-sm">Tidak ada temuan masalah atau pelanggaran SOP yang tercatat dalam audit ini.</span>
                          <span className="text-xs text-muted-foreground">Toko telah memenuhi seluruh spesifikasi standar optimal.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    findings.map((finding: any) => (
                      <TableRow key={finding.id} className="print:border-gray-200 print:break-inside-avoid hover:bg-muted/20">
                        <TableCell className="font-medium text-xs align-top pt-4 print:text-black">
                          <div className="line-clamp-3 print:line-clamp-none font-semibold text-foreground">
                            {(finding.question as any)?.question_text || 'Kriteria Umum Audit'}
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <div className="font-bold text-sm text-foreground print:text-black mb-1">{finding.title}</div>
                          {finding.description ? (
                            <div className="text-xs text-muted-foreground print:text-gray-700 leading-relaxed print:line-clamp-none bg-muted/20 print:bg-transparent p-2.5 rounded-lg border border-border/40 print:border-none print:p-0 mt-1.5">
                              {finding.description}
                            </div>
                          ) : (
                            <div className="text-xs italic text-muted-foreground/60 print:text-gray-400 mt-1">
                              Tidak ada deskripsi detail atau catatan eviden yang disertakan.
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center align-top pt-4">
                          {getSeverityBadge(finding.severity)}
                        </TableCell>
                        <TableCell className="text-center align-top pt-4">
                           {finding.status === 'Open' ? (
                            <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 print:border-red-400 print:text-red-700 font-bold px-3 py-1 rounded-full text-[11px]">
                              Terbuka (Action Req.)
                            </Badge>
                           ) : (
                            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-[11px]">
                              {finding.status === 'Closed' ? 'Selesai Diperbaiki' : finding.status}
                            </Badge>
                           )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Official Executive Print Sign-Off Footer (Only Visible in Print or Bottom Report) */}
        <div className="col-span-1 md:col-span-3 pt-12 pb-6 border-t-2 border-dashed border-border/70 print:border-gray-300 mt-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
            <div className="p-4 border border-border/60 rounded-xl print:border-gray-300 print:p-4 bg-muted/10 print:bg-transparent">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-600 block mb-12">
                Disiapkan Oleh (Auditori & Analis Toko):
              </span>
              <div className="border-b border-foreground/30 print:border-gray-400 w-48 mb-2" />
              <span className="text-xs font-bold text-foreground print:text-black block">Spesialisas E-Commerce & Growth Hacker</span>
              <span className="text-[11px] text-muted-foreground print:text-gray-500">Marketplace Audit OS Practitioner</span>
            </div>

            <div className="p-4 border border-border/60 rounded-xl print:border-gray-300 print:p-4 bg-muted/10 print:bg-transparent">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-600 block mb-12">
                Disetujui Oleh (Penerima Laporan):
              </span>
              <div className="border-b border-foreground/30 print:border-gray-400 w-48 mb-2" />
              <span className="text-xs font-bold text-foreground print:text-black block">{audit.store?.name || 'Brand Owner / E-Commerce Manager'}</span>
              <span className="text-[11px] text-muted-foreground print:text-gray-500">Manajemen Toko Marketplace</span>
            </div>
          </div>

          <div className="text-center text-[11px] font-medium text-muted-foreground print:text-gray-500 pt-4 border-t border-border/40 print:border-gray-200">
            <p>
              Laporan ini dibuat dan ditandatangani secara elektronik via <strong>Platform Marketplace Audit OS</strong>. Seluruh rekomendasi berbasis algoritma pencarian Shopee & TikTok Shop terkini.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

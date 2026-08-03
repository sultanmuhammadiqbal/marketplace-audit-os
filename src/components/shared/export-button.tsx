'use client'

import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'

export function ExportButton() {
  return (
    <Button 
      variant="default" 
      className="print:hidden font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center gap-2 px-4 h-10 transition-all" 
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" /> 
      <span>Ekspor Laporan PDF / Cetak</span>
    </Button>
  )
}

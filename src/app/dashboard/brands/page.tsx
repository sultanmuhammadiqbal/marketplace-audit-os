import Link from 'next/link'
import { Plus, Tag, Layers, CheckCircle2, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getMasterProducts } from '@/server/actions/brands'
import { getOrganizations } from '@/server/actions/organizations'
import { BulkCatalogSync } from '@/components/dashboard/brands/bulk-catalog-sync'

function formatCurrency(num: number | undefined): string {
  if (num === undefined || isNaN(num) || num === 0) return 'Rp 0'
  return 'Rp ' + Math.round(num).toLocaleString('id-ID')
}

export default async function BrandsPage() {
  const organizations = await getOrganizations()
  const activeOrg = organizations[0]

  const products = activeOrg ? await getMasterProducts(activeOrg.id) : []

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            Brand & Master SKU Catalog
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {products.length} Active SKUs
            </span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Scalable retail catalog management optimized for high-volume SKUs and automated ETL reconciliation.
          </p>
        </div>

        {/* Deprioritized single-entry button */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard/brands/new">
            <Button variant="outline" size="sm" className="text-xs font-extrabold rounded-xl border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-300">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Manual Single Entry (Legacy)
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk Import & Auto-Sync Engine Deck */}
      {activeOrg && (
        <BulkCatalogSync organizationId={activeOrg.id} />
      )}

      {/* Master Products Table */}
      <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-zinc-900 dark:via-zinc-800/50 dark:to-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">Consolidated Master Product Repository</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">All SKUs mapped to advertising metrics and marketplace audit findings.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80 dark:bg-zinc-800/40 border-b border-gray-200 dark:border-zinc-800">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] font-black text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 py-4">SKU Code</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Master Product Name</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Brand Portfolio</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Category</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Retail Price (IDR)</TableHead>
                <TableHead className="text-right font-black text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Pipeline Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-gray-500 dark:text-gray-400 font-bold">
                    No product SKUs cataloged. Drop a CSV above or run the Auto-Sync engine!
                  </TableCell>
                </TableRow>
              ) : (
                products.map((prod) => (
                  <TableRow key={prod.id} className="hover:bg-indigo-50/30 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                    <TableCell className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 py-4">
                      {prod.sku}
                    </TableCell>
                    <TableCell className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {prod.master_name}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        {prod.brand_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      {prod.category}
                    </TableCell>
                    <TableCell className="font-mono font-black text-sm text-gray-900 dark:text-emerald-400">
                      {formatCurrency(prod.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {prod.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}


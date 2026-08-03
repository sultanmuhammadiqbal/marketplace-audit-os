import { getOrganizations } from '@/server/actions/organizations'
import { getMasterProducts, getOrganizationUploadStatus } from '@/server/actions/etl'
import { UploadClient } from './upload-client'
import { redirect } from 'next/navigation'
import { InjectDemoDataButton } from '@/components/dashboard/inject-demo-data-button'

export default async function EtlUploadPage() {
  const organizations = await getOrganizations()
  const activeOrg = organizations[0]

  if (!activeOrg) {
    redirect('/onboarding')
  }

  const uploadStatus = await getOrganizationUploadStatus(activeOrg.id)
  const masterProducts = await getMasterProducts(activeOrg.id)

  return (
    <div className="flex-1 space-y-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-white/90 dark:to-gray-400 bg-clip-text text-transparent">
            E-Commerce ETL Engine
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
            Upload, normalize, and transform campaign performance datasets from Shopee and TikTok Shop into unified analytical models.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <InjectDemoDataButton organizationId={activeOrg.id} />
        </div>
      </div>

      <UploadClient
        organizationId={activeOrg.id}
        uploadStatus={uploadStatus}
        initialMasterProducts={masterProducts}
      />
    </div>
  )
}

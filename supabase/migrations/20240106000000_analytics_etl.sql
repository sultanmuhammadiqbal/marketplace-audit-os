-- 20240106000000_analytics_etl.sql
-- Universal E-Commerce ETL Analytics Schema for Shopee and TikTok Shop

-- 1. Update organizations table with trial usage tracking
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS upload_count INT NOT NULL DEFAULT 0;

-- 2. Create master_products table (Clean normalized master product names)
CREATE TABLE public.master_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  master_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_org_master_name UNIQUE(organization_id, master_name)
);

-- 3. Create product_mappings table (Maps platform-specific messy names to master products)
CREATE TABLE public.product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_product_id UUID NOT NULL REFERENCES public.master_products(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('Shopee', 'TikTok')),
  original_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_master_platform_original UNIQUE(master_product_id, platform, original_name)
);

-- 4. Create campaign_metrics table (Stores daily normalized advertising performance data)
CREATE TABLE public.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('Shopee', 'TikTok')),
  product_id UUID NOT NULL REFERENCES public.master_products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend NUMERIC NOT NULL DEFAULT 0,
  views INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  orders INT NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_org_platform_product_date UNIQUE (organization_id, platform, product_id, date)
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_master_products_org ON public.master_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_master ON public.product_mappings(master_product_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_org_date ON public.campaign_metrics(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_product ON public.campaign_metrics(product_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for master_products
CREATE POLICY "Users can manage master_products in their organizations" ON public.master_products
  FOR ALL USING (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

-- 8. RLS Policies for product_mappings
CREATE POLICY "Users can manage product_mappings for accessible master products" ON public.product_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.master_products
      WHERE master_products.id = product_mappings.master_product_id
      AND master_products.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

-- 9. RLS Policies for campaign_metrics
CREATE POLICY "Users can manage campaign_metrics in their organizations" ON public.campaign_metrics
  FOR ALL USING (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

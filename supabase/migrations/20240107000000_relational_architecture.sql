-- 20240107000000_relational_architecture.sql
-- Pivot to Bottom-Up Relational Architecture linking ETL Campaign Metrics to Stores and Clients

-- 1. Add client_id and store_id to campaign_metrics
ALTER TABLE public.campaign_metrics
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- 2. Create high-performance indexes for cascading filter queries
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_client_store ON public.campaign_metrics(organization_id, client_id, store_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_store_id ON public.campaign_metrics(store_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_client_id ON public.campaign_metrics(client_id);

-- 3. Allow master_products to be tagged by client_id in catalog workflows
ALTER TABLE public.master_products
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_master_products_client ON public.master_products(client_id);

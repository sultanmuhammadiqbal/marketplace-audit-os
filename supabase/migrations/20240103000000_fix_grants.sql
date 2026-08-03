-- 1. Berikan Hak Akses Skema Publik Penuh ke Role Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Atur Default Privileges agar tabel baru otomatis mendapatkan hak akses
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. Pastikan RLS Policy Organizations & Memberships
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert organizations" ON public.organizations;
CREATE POLICY "Allow authenticated insert organizations" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated select organizations" ON public.organizations;
CREATE POLICY "Allow authenticated select organizations" ON public.organizations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert memberships" ON public.organization_memberships;
CREATE POLICY "Allow authenticated insert memberships" ON public.organization_memberships FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated select memberships" ON public.organization_memberships;
CREATE POLICY "Allow authenticated select memberships" ON public.organization_memberships FOR SELECT TO authenticated USING (true);

-- 20240101000001_rls_policies.sql

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id 
  FROM public.organization_memberships 
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(org_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.roles r ON om.role_id = r.id
    WHERE om.organization_id = org_id
    AND om.user_id = auth.uid()
    AND r.name = ANY(required_roles)
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. POLICIES

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile and org members" ON public.profiles;
CREATE POLICY "Users can read own profile and org members" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR
    id IN (
      SELECT user_id FROM public.organization_memberships
      WHERE organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

-- Organizations
DROP POLICY IF EXISTS "Users can read organizations they are a member of" ON public.organizations;
CREATE POLICY "Users can read organizations they are a member of" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = organizations.id
      AND organization_memberships.user_id = auth.uid()
    )
  );

-- Roles, Permissions, Role_Permissions
DROP POLICY IF EXISTS "Anyone can read roles" ON public.roles;
CREATE POLICY "Anyone can read roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read permissions" ON public.permissions;
CREATE POLICY "Anyone can read permissions" ON public.permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone can read role_permissions" ON public.role_permissions FOR SELECT USING (true);

-- Organization Memberships
DROP POLICY IF EXISTS "Users can read memberships for their organizations" ON public.organization_memberships;
CREATE POLICY "Users can read memberships for their organizations" ON public.organization_memberships
  FOR SELECT USING (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

-- Clients Policies
DROP POLICY IF EXISTS "Users can read clients in their organizations" ON public.clients;
CREATE POLICY "Users can read clients in their organizations" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = clients.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
CREATE POLICY "Admins can insert clients" ON public.clients
  FOR INSERT WITH CHECK (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
CREATE POLICY "Admins can update clients" ON public.clients
  FOR UPDATE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
CREATE POLICY "Admins can delete clients" ON public.clients
  FOR DELETE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

-- Client Memberships
DROP POLICY IF EXISTS "Users can read client memberships in their organizations" ON public.client_memberships;
CREATE POLICY "Users can read client memberships in their organizations" ON public.client_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_memberships om ON c.organization_id = om.organization_id
      WHERE c.id = client_memberships.client_id
      AND om.user_id = auth.uid()
    )
  );

-- Brands Policies
DROP POLICY IF EXISTS "Users can read brands in their organizations" ON public.brands;
CREATE POLICY "Users can read brands in their organizations" ON public.brands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = brands.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert brands" ON public.brands;
CREATE POLICY "Admins can insert brands" ON public.brands
  FOR INSERT WITH CHECK (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

DROP POLICY IF EXISTS "Admins can update brands" ON public.brands;
CREATE POLICY "Admins can update brands" ON public.brands
  FOR UPDATE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

DROP POLICY IF EXISTS "Admins can delete brands" ON public.brands;
CREATE POLICY "Admins can delete brands" ON public.brands
  FOR DELETE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

-- Stores Policies
DROP POLICY IF EXISTS "Users can read stores in their organizations" ON public.stores;
CREATE POLICY "Users can read stores in their organizations" ON public.stores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = stores.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert stores" ON public.stores;
CREATE POLICY "Admins can insert stores" ON public.stores
  FOR INSERT WITH CHECK (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

DROP POLICY IF EXISTS "Admins can update stores" ON public.stores;
CREATE POLICY "Admins can update stores" ON public.stores
  FOR UPDATE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

DROP POLICY IF EXISTS "Admins can delete stores" ON public.stores;
CREATE POLICY "Admins can delete stores" ON public.stores
  FOR DELETE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

-- Activity Logs
DROP POLICY IF EXISTS "Users can read activity logs in their organizations" ON public.activity_logs;
CREATE POLICY "Users can read activity logs in their organizations" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = activity_logs.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert activity logs for their organizations" ON public.activity_logs;
CREATE POLICY "Users can insert activity logs for their organizations" ON public.activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = activity_logs.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

-- 1. Berikan Hak Akses (GRANT) ke role authenticated & anon
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. Pastikan RLS Policy INSERT untuk Organizations
DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;
CREATE POLICY "Authenticated users can insert organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Pastikan RLS Policy INSERT untuk Organization Memberships
DROP POLICY IF EXISTS "Authenticated users can insert organization memberships" ON public.organization_memberships;
CREATE POLICY "Authenticated users can insert organization memberships"
  ON public.organization_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Pastikan RLS Policy INSERT untuk Profiles
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
CREATE POLICY "Authenticated users can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
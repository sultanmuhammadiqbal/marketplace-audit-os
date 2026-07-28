-- 20240101000001_rls_policies.sql

-- Enable RLS on all tables
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

-- Profiles: Users can read their own profile and profiles of users in their organizations
CREATE POLICY "Users can read own profile and org members" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    id IN (
      SELECT user_id FROM public.organization_memberships 
      WHERE organization_id IN (SELECT public.get_user_organizations())
    )
  );

-- Organizations: Users can read organizations they are a member of
CREATE POLICY "Users can read organizations they are a member of" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = organizations.id
      AND organization_memberships.user_id = auth.uid()
    )
  );

-- Roles, Permissions, Role_Permissions: Everyone can read
CREATE POLICY "Anyone can read roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Anyone can read permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Anyone can read role_permissions" ON public.role_permissions FOR SELECT USING (true);

-- Organization Memberships: Users can read memberships for their organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Users can read memberships for their organizations" ON public.organization_memberships
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_organizations())
  );

-- Clients: Read if in organization. Write if admin/owner.
-- Note: In this MVP, we assume any write access check is handled at application level too, but we can enforce it here by checking role_id if we want. For now, since user requested RLS enforce "organization owners and admins can manage", we should check role.
-- To avoid complex joins in every query, we can use a helper function or join against roles.
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

-- Clients Policies
CREATE POLICY "Users can read clients in their organizations" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = clients.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert clients" ON public.clients
  FOR INSERT WITH CHECK (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

CREATE POLICY "Admins can update clients" ON public.clients
  FOR UPDATE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

CREATE POLICY "Admins can delete clients" ON public.clients
  FOR DELETE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

-- Client Memberships
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
CREATE POLICY "Users can read brands in their organizations" ON public.brands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = brands.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert brands" ON public.brands
  FOR INSERT WITH CHECK (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

CREATE POLICY "Admins can update brands" ON public.brands
  FOR UPDATE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

CREATE POLICY "Admins can delete brands" ON public.brands
  FOR DELETE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

-- Stores Policies
CREATE POLICY "Users can read stores in their organizations" ON public.stores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = stores.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert stores" ON public.stores
  FOR INSERT WITH CHECK (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

CREATE POLICY "Admins can update stores" ON public.stores
  FOR UPDATE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

CREATE POLICY "Admins can delete stores" ON public.stores
  FOR DELETE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

-- Activity Logs: Read if in organization. Insert if authenticated and part of org. No update/delete.
CREATE POLICY "Users can read activity logs in their organizations" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = activity_logs.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity logs for their organizations" ON public.activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_memberships.organization_id = activity_logs.organization_id
      AND organization_memberships.user_id = auth.uid()
    )
  );

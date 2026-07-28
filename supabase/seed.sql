-- seed.sql

-- Create basic roles
INSERT INTO public.roles (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'organization_owner', 'Full control over the organization'),
  ('22222222-2222-2222-2222-222222222222', 'organization_admin', 'Can manage clients, brands, and stores'),
  ('33333333-3333-3333-3333-333333333333', 'viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

-- Note: We skip inserting into auth.users here to avoid complexity with encrypted passwords.
-- You can create a user from the Supabase Studio UI (http://localhost:54323)
-- and manually create their profile, organization, and organization_membership.
-- Or use the application registration flow once implemented.

-- Create an organization
INSERT INTO public.organizations (id, name) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme Agency')
ON CONFLICT (id) DO NOTHING;

-- Create a client
INSERT INTO public.clients (id, organization_id, name) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Global Retail Corp')
ON CONFLICT (id) DO NOTHING;

-- Create a brand
INSERT INTO public.brands (id, organization_id, client_id, name) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EcoWear')
ON CONFLICT (id) DO NOTHING;

-- Create a store
INSERT INTO public.stores (id, organization_id, client_id, brand_id, name, platform) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'EcoWear Shopee Official', 'shopee')
ON CONFLICT (id) DO NOTHING;

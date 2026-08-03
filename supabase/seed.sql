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

-- Create an Audit Template (Global)
INSERT INTO public.audit_templates (id, name, description) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Audit Komprehensif Shopee & TikTok Shop', 'Audit mendalam untuk optimasi algoritma pencarian (SEO), kualitas visual pendorong konversi, dan efektivitas strategi promosi serta campaign toko.')
ON CONFLICT (id) DO NOTHING;

-- Create Audit Template Modules
INSERT INTO public.audit_template_modules (id, template_id, name, order_index) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Optimasi SEO & Keyword', 1),
  ('11111111-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Kualitas Visual & Konversi', 2),
  ('aaaa1111-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Manajemen Promosi & Campaign', 3)
ON CONFLICT (id) DO NOTHING;

-- Create Audit Questions
INSERT INTO public.audit_questions (id, module_id, question_text, question_type, order_index) VALUES
  -- Optimasi SEO & Keyword
  ('22222222-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Apakah judul produk meletakkan keyword utama dengan search volume tinggi di 5 kata pertama?', 'pass_fail', 1),
  ('33333333-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Apakah struktur penulisan judul produk mengikuti formula standar marketplace (Brand + Kata Kunci Utama + Spesifikasi + Fitur Unggulan)?', 'pass_fail', 2),
  ('44444444-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Apakah deskripsi produk berisikan minimal 300 kata dan menyebarkan secondary keyword secara natural tanpa kesan keyword stuffing?', 'pass_fail', 3),
  
  -- Kualitas Visual & Konversi
  ('55555555-ffff-ffff-ffff-ffffffffffff', '11111111-ffff-ffff-ffff-ffffffffffff', 'Apakah gambar utama/thumbnail bersih dari watermark dan memiliki rasio teks promo maksimal 20%?', 'pass_fail', 1),
  ('66666666-ffff-ffff-ffff-ffffffffffff', '11111111-ffff-ffff-ffff-ffffffffffff', 'Apakah semua variasi produk memiliki foto yang terhubung secara spesifik?', 'pass_fail', 2),
  ('77777777-ffff-ffff-ffff-ffffffffffff', '11111111-ffff-ffff-ffff-ffffffffffff', 'Apakah setiap produk unggulan (hero product) telah dilengkapi video demonstrasi resolusi tinggi berdurasi minimal 15 detik?', 'pass_fail', 3),
  
  -- Manajemen Promosi & Campaign
  ('88888888-ffff-ffff-ffff-ffffffffffff', 'aaaa1111-ffff-ffff-ffff-ffffffffffff', 'Apakah toko secara konsisten mengaktifkan fitur voucher diskon bertingkat (Tiered Discount / Flexi Combo) untuk mendongkrak AOV?', 'pass_fail', 1),
  ('99999999-ffff-ffff-ffff-ffffffffffff', 'aaaa1111-ffff-ffff-ffff-ffffffffffff', 'Evaluasi efektivitas dan tingkat ROAS (Return on Ad Spend) dari iklan berbayar (Search Ads / Shop Ads) selama 30 hari terakhir (Skala 1-5).', 'scale', 2),
  ('00000000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-ffff-ffff-ffff-ffffffffffff', 'Apakah konfigurasi stok dan harga coret (slashed price) untuk partisipasi dalam campaign Flash Sale atau Promo Kembar bulanan sudah kompetitif?', 'pass_fail', 3)
ON CONFLICT (id) DO NOTHING;


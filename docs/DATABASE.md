# Database Strategy

## Overview
We utilize Supabase PostgreSQL as our primary data store. The architecture revolves around a multi-tenant hierarchy with Row-Level Security (RLS) guaranteeing data isolation.

## Entities
1. **organizations**: Root tenant. `id` (UUID).
2. **profiles**: User profiles linked to `auth.users`.
3. **organization_memberships**: Links users to organizations with a specific role (`role_id`).
4. **roles**: e.g., `organization_owner`, `organization_admin`, `viewer`.
5. **clients**: Belongs to an organization. `organization_id` foreign key.
6. **brands**: Belongs to an organization, optionally linked to a client.
7. **stores**: Belongs to an organization, linked to a client/brand. `platform` enum (e.g., Shopee, TikTok Shop).
8. **activity_logs**: Append-only log for auditing tenant actions.

## Data Types & Conventions
- Primary keys are `UUID`s.
- Standard audit fields: `created_at`, `updated_at` (using `timestamptz`).
- Soft deletes implemented via a `deleted_at` column where beneficial (e.g., for recovering accidental store deletions).
- Indexes are applied on all foreign keys and frequently filtered tenant fields (like `organization_id`).

## Migration Workflow
All database schema changes, seed data, and RLS policies must be scripted through Supabase CLI migrations. No undocumented remote database changes.

# Permissions & Roles

## Roles
1. **organization_owner**: Full control over the organization. Can manage members, clients, brands, stores, and billing.
2. **organization_admin**: Can manage clients, brands, and stores within the organization, but cannot modify organization ownership.
3. **viewer**: Read-only access to the organization's entities.
*(Future roles: auditor, client_owner, client_manager, client_staff)*

## Authorization Enforcement
Authorization is strictly enforced in two layers:
1. **Application Server Logic**: Server Actions and API Routes verify the user's role before processing mutations.
2. **Database (Row-Level Security)**: PostgreSQL RLS policies block unauthorized `INSERT`/`UPDATE`/`DELETE` attempts directly at the database level.

## Data Access
- **Tenants**: Data is segregated by `organization_id`.
- **Memberships**: The `organization_memberships` table defines which organizations a user has access to, and with what role.

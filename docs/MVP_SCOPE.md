# MVP Scope (Sprint 0)

## Objective
Establish a secure, maintainable, production-oriented foundation for Marketplace Audit OS.

## In Scope
- **Authentication**: Register, Login, Logout (Supabase Server-Side Auth).
- **Multi-tenancy**: Organization-based hierarchy (Organization -> Client -> Brand -> Store).
- **Tenant Management**: Create/Manage Organizations, Clients, Brands, and Stores.
- **Roles & Permissions**: Basic RBAC (`organization_owner`, `organization_admin`, `viewer`).
- **Dashboard**: High-level metrics (Total clients, brands, stores) and activity log.
- **Security**: Row-Level Security (RLS) policies enforcing strict cross-tenant isolation.
- **UI/UX**: Clean, professional B2B SaaS interface using shadcn/ui.

## Out of Scope (For Now)
- Audit templates, checklists, and scoring algorithms.
- Task management and recommendations.
- Advanced analytics and reporting.
- Subscription billing and payment gateways.
- Social login / SSO.

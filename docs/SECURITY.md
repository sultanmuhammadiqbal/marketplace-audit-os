# Security Guidelines

## Row-Level Security (RLS)
- **Mandatory**: Every exposed application table must have RLS enabled.
- **Tenant Isolation**: RLS policies must strictly verify `organization_id` via `organization_memberships` to prevent cross-tenant data leakage.
- **No Overly Broad Policies**: Avoid `using (true)` or unrestricted insert/update policies. All operations must be verified against user session and permissions.

## Application Security
- **Authentication**: Use Supabase Server-Side Auth.
- **Cookies**: Auth state must be securely stored in HttpOnly cookies (where appropriate by Supabase standards) and processed on the server.
- **Client-Side Restrictions**: Do not expose sensitive data to Client Components. Never expose Supabase service role credentials to the client.
- **Validation**: Every request payload must be validated with Zod before being processed or inserted into the database.

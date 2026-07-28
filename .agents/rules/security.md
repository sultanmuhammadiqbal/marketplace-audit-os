# Security Rules

- **RLS**: Row-Level Security must be verified for cross-tenant isolation.
- **Server Auth**: Use Supabase Server Auth; no client-side JWT handling for core auth state.
- **Validation**: All user inputs and API payload must be validated with Zod.
- **Secret Management**: Do not expose service keys to the client under any circumstance.

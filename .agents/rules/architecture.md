# Architecture Rules

- **Strict Multi-tenancy**: Every tenant table MUST link to an `organization_id`.
- **Framework**: Use Next.js App Router (React Server Components by default).
- **No Monoliths**: Split files into small, domain-focused modules. UI components, Data access, server actions, and schemas must be separated.
- **Server State**: Use Server Actions for all database mutations. Do NOT write business logic in UI Components.

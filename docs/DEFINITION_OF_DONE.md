# Definition of Done (DoD)

For Sprint 0 features to be considered complete, they must meet the following criteria:

1. **Implementation**
   - Feature fully implemented according to MVP scope.
   - UI matches B2B SaaS professional standards using shadcn/ui.
   - Responsive design works on standard viewports.

2. **Quality Gates**
   - **TypeScript**: `tsc --noEmit` passes with 0 errors.
   - **Linting**: `eslint .` passes with 0 errors.
   - **Build**: `npm run build` completes successfully.

3. **Database & Security**
   - All schema changes exist in migration files.
   - Seed data represents the necessary initial state.
   - RLS is applied, tested, and actively blocks cross-tenant access.

4. **Testing**
   - Form validation tests pass.
   - Unit/Integration tests pass.
   - Playwright basic smoke tests pass.
   - Playwright security test proves Tenant A cannot read/modify Tenant B's data.

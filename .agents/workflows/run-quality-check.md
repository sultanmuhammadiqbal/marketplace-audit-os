# Run Quality Check Workflow

1. Run `npx tsc --noEmit`. Ensure 0 errors.
2. Run `npm run lint`. Ensure 0 errors.
3. Run `npm run test` (Vitest unit and integration).
4. Run `npx playwright test`.

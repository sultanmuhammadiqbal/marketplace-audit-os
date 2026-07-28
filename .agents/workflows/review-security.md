# Review Security Workflow

1. Ensure the user's role and organization membership is validated in API/Action logic.
2. Ensure the RLS policies in the database strictly check for `organization_id` based on user memberships.
3. Verify that cross-tenant read/write tests are passing in Playwright.

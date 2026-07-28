# Database Migrations Rules

- **No Remote Changes**: All database changes MUST be made through Supabase CLI migrations.
- **RLS Required**: Every new table MUST have RLS enabled and corresponding policies in migration files.
- **Migration Names**: Keep migration filenames descriptive.
- **Types**: Always regenerate database types after writing new migrations.

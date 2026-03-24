# Rollback Strategy

## Git-based Rollback (Code)

Every deployment is tied to a git commit. To roll back:

```bash
# Find the last known-good commit
git log --oneline -20

# Create a rollback commit (safe — never force-push main)
git revert <bad-commit-hash>
git push origin main

# Or revert a range of commits
git revert <oldest-bad>..<newest-bad>
git push origin main
```

> **Never** `git reset --hard` on `main` — it rewrites shared history.

---

## Vercel Rollback (Instant)

Vercel keeps every deployment. Roll back without code changes:

1. Go to **vercel.com → your project → Deployments**
2. Find the last good deployment
3. Click **⋯ → Promote to Production**

This takes ~30 seconds and requires no code changes.

---

## Database Rollback (Supabase Migrations)

Migrations in `supabase/migrations/` are numbered and sequential.

### If a migration broke something:

```sql
-- Connect to Supabase SQL editor and run the inverse manually.
-- Example: if 20260324_security_indexes.sql broke something
DROP INDEX IF EXISTS idx_plans_user_date;
-- ... drop each index that caused the issue
```

### Point-in-time recovery (nuclear option):

Supabase Pro and above supports PITR (Point-In-Time Recovery):
- Go to **Supabase Dashboard → Project Settings → Database → Backups**
- Select a timestamp before the bad migration
- Restore to a new project (never restore over prod without a backup)

---

## Rollback Checklist

Before any risky deployment:

- [ ] Note the current git commit hash (`git rev-parse HEAD`)
- [ ] Note the current Vercel deployment URL
- [ ] Run `supabase db dump` for a schema snapshot if changing DB
- [ ] Test in staging/preview deployment first

---

## Environment Variables Rollback

If a bad env var was deployed:
1. Go to **Vercel → Settings → Environment Variables**
2. Update the value
3. Redeploy (Vercel requires a redeploy to pick up env changes)

---

## Contacts

- Supabase status: status.supabase.com
- Vercel status: vercel-status.com

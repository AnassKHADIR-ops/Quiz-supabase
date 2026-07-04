# Math Exams — Supabase backend

The existing Vite frontend in `React-Aps` now uses Supabase Auth and PostgreSQL RPC functions. `Quiz-Backend` is no longer required at runtime.

## Setup

1. Create a Supabase project. In **Authentication → Providers → Email**, disable email confirmation for the same immediate-signup experience as the old app, or keep it enabled and have users confirm their email.
2. Copy `React-Aps/.env.example` to `React-Aps/.env` and supply the project URL and anon key.
3. Authenticate and link the CLI, then apply the migration:

```bash
supabase login
supabase link --project-ref rucpggahyiwufbzjznhf
supabase db push --dry-run
supabase db push
supabase db push --include-seed # optional: adds the existing Mathematics Quiz demo
```
4. Create the teacher account through the app or Supabase Auth, then run in the SQL editor:

```sql
update public.profiles set role = 'teacher' where email = 'anass.khadir@usmba.ac.ma';
```

5. Install frontend dependencies and start it: `cd React-Aps && npm install && npm run dev`.

The migration contains the full schema, indexes, auth profile trigger, RLS policies, secure grading, result review, teacher reporting, and student analytics. Student clients cannot select `choices.is_correct`; answer keys are revealed only by the authorized result-review function after submission.

## Supabase Auth and Profiles (audit)

Flow before fix:
- UI register calls `useAuth.register`.
- `register` calls `supabase.auth.signUp`, then inserts into `public.profiles`.
- When email confirmation is required, `signUp` returns no session, so `auth.uid()` is null.
- The insert fails with RLS policy: "Users can insert own profile".

Resolution:
- Pass `username` via `signUp` metadata.
- Create profiles via a trigger on `auth.users` (`handle_new_user`).
- Enforce self-only RLS policies on `public.profiles`.

Environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

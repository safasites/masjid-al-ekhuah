# Masjid Al-Ekhuah — Project Memory

## Netlify Deployment (CRITICAL)

> [!CAUTION]
> This project deploys to Netlify via CI/CD from the `safasites/masjid-al-ekhuah` GitHub repo.
> **Never use Netlify Drop (manual upload)**. Always push to `main` and let Netlify build from Git.

### Key Setup
- **Netlify site**: `masjid-al-ekhuah.netlify.app`
- **GitHub repo**: `safasites/masjid-al-ekhuah` (branch: `main`)
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Plugin**: `@netlify/plugin-nextjs` v5 (auto-detected)
- **Node version**: 20 (set in `netlify.toml`)

### Past Deployment Issue — Blank Page + Lambda Crashes
The site deployed as a blank white page with `error decoding lambda response: invalid status code returned from lambda: 0` on all admin routes. Root causes were:

1. **Netlify site was not linked to GitHub** — deploys were done via manual Netlify Drop, so code pushes never triggered builds. Fix: link the repo under Site Settings → Build & Deploy → Continuous Deployment.
2. **`createServerSupabase()` used to throw** when env vars were missing — this crashed all serverless lambda functions. Fix: it now returns `null`, and all API routes use `requireDb()` which returns a 503 JSON response instead of crashing.
3. **Middleware matcher included `/api/admin/:path*`** — the middleware imports `jose` (JWT library) which uses `CompressionStream`/`DecompressionStream` APIs not supported in Netlify's Edge Runtime. This crashed the Edge Function for ALL admin API routes. Fix: removed `/api/admin/:path*` from the matcher since API routes handle their own auth.
4. **`tailwindcss` was in `devDependencies`** — Netlify prunes devDeps in production, so CSS was missing. Fix: moved to `dependencies`.
5. **Build blocked by "Unrecognized Git contributor"**  -- Netlify's free plan restricts private repos to only one contributor (site owner). Fix: Set repository visibility to **Public** to allow external contributors to trigger builds on the free tier.
### Environment Variables (Netlify Dashboard)
These must be set in the Netlify dashboard under Site Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

### Rules to Prevent Recurrence
- **Git Contributor Matching**: Since this is a private repo on Netlify's free Starter plan, only one verified team member (`iboyprime68-web` / `iboyprime68@gmail.com`) is allowed to trigger builds. Always ensure your local git config (`user.name` and `user.email`) matches exactly before committing. If Netlify blocks a deploy for "unrecognized Git contributor", amend the last commit to use the correct email and force push.
- **Never throw in `createServerSupabase()`** — return `null` and let callers handle it
- **Always use `requireDb()`** in API routes — never call `createServerSupabase()` directly
- **Never add API route paths to the middleware matcher** — API routes handle their own auth
- **Keep `tailwindcss` in `dependencies`**, not `devDependencies`
- **Always verify the Netlify site is linked to GitHub** before debugging deploy issues
- **Keep repositories Public on Netlify Free Plan** -- To allow collaboration on the free tier, the repo visibility must be set to **Public**, otherwise only the site owner can trigger builds.

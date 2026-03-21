# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build (TypeScript errors block builds; ESLint does not)
npm run lint     # ESLint
npm run clean    # Clear Next.js cache
```

No test suite exists. Type-check only: `npx tsc --noEmit`.

## Environment Variables

Required (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project (public)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only secret for admin API routes
- `ADMIN_PASSWORD` — Password for `/admin` login
- `ADMIN_SESSION_SECRET` — 32-char random hex string for JWT signing
- `APP_URL` — Deployed URL

Optional: `MYMEMORY_EMAIL` (increases translation API limit to 10k words/day), `DISABLE_HMR=true` (AI Studio).

## Architecture

**Next.js 15 app router.** One large client component (`app/page.tsx`) drives the home page. Sub-pages (`events`, `courses`, `books`, `quran`) are separate routes. The admin section lives under `app/admin/`.

### Server vs. Client Split
- `app/layout.tsx` — server component; loads fonts, wraps in `ThemeProvider` + `AnimationProvider`
- `app/quran/page.tsx` — server component with ISR (`revalidate = 86400`); passes data to a client component
- All other pages and the entire home page — `'use client'` components fetching via `useEffect`

### Supabase Pattern
Server-side always uses `createServerSupabase()` from `lib/supabase-server.ts`, which returns `null` if env vars are missing (needed for static generation). API routes must use `requireDb()` which returns a `[db, null] | [null, Response]` tuple — this gives a 503 fallback instead of crashing when the DB is unavailable:

```ts
const [db, err] = requireDb();
if (err) return err;
```

Client-side uses the anon client from `lib/supabase.ts`.

### Theming (Tailwind v4)
No `tailwind.config.*` file. Theme tokens live in `app/globals.css` under `@theme {}`. There are 16 colour themes (8 dark + 8 light) applied via `data-theme` / `data-light` attributes on `<html>`. Each theme remaps `--color-amber-*` variables in OKLCH. Always use `text-amber-*` / `bg-amber-*` Tailwind classes — they automatically remap with the theme.

Use `useTheme()` / `isLightTheme(theme)` from `app/theme-provider.tsx` to conditionally style for light mode. The pattern:
```tsx
const { theme } = useTheme();
const lightMode = isLightTheme(theme);
const bg = lightMode ? 'bg-[#f8f5ee]' : 'bg-[#0a0804]';
```

Named shadow utilities in `globals.css`: `shadow-theme-glow`, `shadow-theme-soft`, `shadow-theme-strong`, `shadow-theme-nav` — use these instead of hardcoded amber shadows.

### Animation
`useAnimationConfig()` from `app/animation-provider.tsx` provides pre-built motion props. Always use these instead of writing raw motion variants, so reduced-motion mode is respected:
- `anim.cardEntry(index)` — staggered card entrance
- `anim.sectionEntry` — whileInView section fade
- `anim.cardHover` — hover lift effect
- `anim.modalEntry` — spring modal
- `anim.isSimplified` — boolean; skip delays/blur when true
- `anim.blur(n)` — GPU-expensive; avoid in large lists

Import motion from `motion/react` (not `framer-motion`).

### Multi-Language
UI strings for en/ku/ar are inlined as a `translations` constant at the top of each page component. Language is stored in `localStorage('mosque-lang')`. Arabic/Kurdish content uses `dir="rtl"` on the wrapper; use `dir="auto"` on individual text nodes of unknown language.

For admin-created content, `lib/translate.ts` calls MyMemory API: `translateText(text, 'ar' | 'ckb')`. Kurdish locale code is `'ckb'` (not `'ku'`).

### Fonts
Three fonts loaded in `app/layout.tsx` via `next/font/google`:
- `--font-sans` (Inter) — body text
- `--font-display` (Outfit) — headings (`font-display` Tailwind class)
- `--font-arabic` (Amiri) — Arabic text; applied via `.tajweed-text` CSS class or inline `style={{ fontFamily: 'var(--font-arabic)' }}`

### Auth / Middleware
`middleware.ts` protects `/admin/*` (except `/admin/login`) using a JWT in `admin_session` cookie signed with `ADMIN_SESSION_SECRET`. API routes under `/api/admin/*` handle their own auth checks — the middleware matcher intentionally excludes them to avoid Edge Runtime issues.

### Path Aliases
`@/` maps to the repository root. Use `@/lib/...`, `@/app/...` etc.

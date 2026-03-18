# Masjid Al-Ekhuah Website

Website for Masjid Al-Ekhuah, Birmingham — built with Next.js, Supabase, and deployed on Netlify.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL database + Storage for timetable images)
- **Aladhan API** — automatic prayer times (no API key needed)
- **Netlify** — hosting and deployment

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

## Database Setup

Run `supabase-schema.sql` in the Supabase SQL Editor to create all tables and seed default data.

## Environment Variables

See `.env.example` for all required variables. These must be set in Netlify's environment variables for production.

## Admin Access

Visit `/admin` — you'll be redirected to the login page. The password is set via the `ADMIN_PASSWORD` environment variable.

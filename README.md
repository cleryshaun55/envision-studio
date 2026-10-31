# Envision Studio website

A responsive React + Vite website for Envision Studio.

## Included
- Homepage, services, portfolio filters, about/manifesto, process and contact sections
- Responsive mobile navigation and layouts
- Portfolio concept cards and project detail modal
- WhatsApp enquiry flow using +2347066923248
- Optional Supabase enquiry submission integration
- Supabase-backed owner sign-in, portfolio management and enquiry viewing
- Supabase SQL schema with row-level security policies

## Run locally
1. Install Node.js 18 or newer.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your Supabase Project URL and anon key to `.env`.
5. Run `npm run dev` and open the local URL printed by Vite.

## Supabase setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. In Supabase Authentication, create an owner user with your email and a strong password.
4. Copy the owner's Auth user UUID.
5. Run this SQL, replacing the placeholder with the real UUID:

   `insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID');`

6. Copy the Project URL and anon/public key into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7. Restart the development server.

The contact form saves enquiries to the `enquiries` table when Supabase is configured. Without Supabase, it prepares the enquiry in WhatsApp instead. The dashboard uses Supabase Auth; only UUIDs listed in `admin_users` can manage projects or read enquiries.

## Before public launch
- Replace the illustrative portfolio concepts with real approved Envision Studio work.
- Confirm image licensing and availability; the current concept images are remote Unsplash URLs.
- Add a custom domain and hosting provider.
- Add your real business email and any other confirmed social accounts.
- Test enquiry submission and owner access in the deployed environment.
- Consider adding image upload to a private Supabase Storage bucket; the current dashboard accepts image URLs.
- Add and verify Privacy Policy and Terms text appropriate to how you collect and use customer data.
- Set up backups and test access policies before collecting real customer enquiries.

## Brand details used
- WhatsApp: +2347066923248
- Facebook: https://facebook.com/profile.php?id=61589018991358

# AQREVO — The Creative House

A responsive React + Vite website for AQREVO — The Creative House.

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
- Replace the illustrative portfolio concepts with real approved AQREVO work.
- Confirm image licensing and availability; the current concept images are remote Unsplash URLs.
- Add a custom domain and hosting provider.
- Add your real business email and any other confirmed social accounts.
- Test enquiry submission and owner access in the deployed environment.
- Consider adding image upload to a private Supabase Storage bucket; the current dashboard accepts image URLs.
- Add and verify Privacy Policy and Terms text appropriate to how you collect and use customer data.
- Set up backups and test access policies before collecting real customer enquiries.

## Brand details used
- Public brand: AQREVO — The Creative House
- Tagline: Make Ideas Iconic.
- Visual direction: warm ivory, deep navy and electric blue
- Brand legal status: owner-approved brand direction; trademark/CAC/domain clearance remains separate
- WhatsApp: +2347066923248
- Facebook: https://facebook.com/profile.php?id=61589018991358


## Business operations (November 2026)

The admin area now includes a service catalogue, itemised quotation builder, printable quotations, and payment records with verified-balance calculations. A project tracker is also available to administrators.

The additive database setup is documented in `supabase/business_operations.sql`. It creates the service catalogue, quotations, quotation line items, payment ledger, and project update tables. All business records are admin-only through Row Level Security; only active and public service entries can be read by visitors. Existing enquiry-based quotation fields remain in place for backwards compatibility.

The quotation workspace supports draft creation, custom line items, quantity and unit-price calculations, discounts, configurable deposits, validity dates, revision terms, timeline, WhatsApp/email handoff, and browser print-to-PDF. Payment entries begin as pending and must be verified against the actual account transaction before they reduce the outstanding balance.

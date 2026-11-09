# AQREVO Pre-Launch Security Review

**Review date:** 9 November 2026  
**Scope:** Supabase database access controls, public-facing views, storage bucket metadata, and current Supabase advisors.  
**Method:** Read-only inspection. No database policies, credentials, or Auth settings were changed during this review.

## Overall result

The core access-control structure is in good shape for the current single-studio workflow:

- Row Level Security is enabled on all 11 tables in the exposed `public` schema.
- Administrative reads and writes are generally gated by the `public.is_admin()` membership check.
- The `public_service_catalogue` view uses both `security_invoker=true` and `security_barrier=true`, and exposes only the public catalogue fields. It does not expose the internal starting-price field.
- The `is_admin()` function is not `SECURITY DEFINER`; it uses a fixed `search_path` and checks the signed-in user's ID against the admin-membership table.
- The public portfolio image bucket is intentionally public for displaying published work, while uploads are restricted to authenticated administrators.

This is a useful baseline, not a complete security certification or penetration test.

## Verified controls

| Area | Observed configuration | Assessment |
|---|---|---|
| Public tables | RLS enabled on all 11 tables | Good |
| Admin membership | User can read only their own membership row | Good |
| Enquiries | Public insert; reads, updates and deletes restricted to admins | Good separation; anti-spam hardening still needed |
| Testimonials | Public insert has length/rating checks and forces `approved=false`; public reads are limited to approved reviews | Good |
| Portfolio projects | Public reads are limited to published projects; admin writes are gated | Good |
| Studio profile | Public read; admin writes | Expected for public profile content |
| Quotations and quotation items | Admin-only access | Good |
| Payments | Admin-only access | Good |
| Project updates | Admin-only access | Good |
| Public catalogue view | Security-invoker and security-barrier options enabled; only public fields exposed | Good |
| Admin check function | Not security definer; fixed search path | Good |
| Portfolio storage | Public bucket; authenticated admin-only uploads | Appropriate for public portfolio images |

## Items to address before public launch

### 1. Enable leaked-password protection

The Supabase Security Advisor returned one warning:

**Leaked Password Protection Disabled.**

Enable the Auth password-security option so compromised passwords are rejected during password changes and sign-up where supported.

Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Status:** Not changed. This requires an Auth security-setting update and should be reviewed in the Supabase dashboard.

### 2. Add server-side enquiry abuse protection

The current public enquiry policy checks that the required name, email, service and description fields are non-empty. It does not provide request throttling or a server-side spam challenge.

Before launch, add a server-enforced anti-abuse layer, such as a honeypot plus rate limiting at an Edge Function or trusted server boundary. Consider maximum lengths for every submitted field. A browser-only check is not sufficient because automated clients can bypass it.

**Status:** Recommendation only; no policy or function changed.

### 3. Set storage-level upload limits

The `portfolio-images` bucket is public, which is appropriate for published portfolio assets. Its inspected `file_size_limit` is currently unset. The frontend already checks image size, but a browser-side limit can be bypassed.

Set a server-side bucket size limit that matches the intended upload ceiling, and define accepted image MIME types. Keep uploads restricted to administrators.

**Status:** Recommendation only; bucket settings not changed.

### 4. Keep public profile fields public-safe

The `studio_profile` table has a public read policy. Only place information in this table that AQREVO is comfortable publishing, including the business contact details and founder/studio profile content.

Do not store private notes, personal contact details, credentials or internal operating information in this table.

**Status:** Current design retained.

## Performance and health notes

- Supabase Health Advisor returned no findings.
- Performance Advisor reported nine indexes as unused. This is not automatically a problem for a young, low-traffic site. Keep them for now; review again after meaningful production usage before removing any index.
- No unused index was removed.

## Release decision

**Current status: baseline controls verified; additional hardening remains before a full public launch.**

Priority order:

1. Enable leaked-password protection.
2. Add server-side enquiry abuse protection and sensible field limits.
3. Set storage bucket upload limits and accepted MIME types.
4. Re-run Supabase Security and Performance Advisors.
5. Test admin access, public enquiry submission, review moderation, portfolio publishing and image uploads with real test accounts.


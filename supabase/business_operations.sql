-- AQREVO / Envision Studio business operations foundation
-- Additive migration: existing enquiries, portfolio, testimonials and profile data remain untouched.
-- Applied to Supabase project vapjmuqfyothtnwtpwlc on 2026-11-09.
-- Includes service_catalogue, quotations, quotation_items, payments and project_updates.
-- RLS is enabled on every new public-schema table. Public visitors can only read active/public services.
-- All quotation, payment and project-update records are admin-only.

create table if not exists public.service_catalogue (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  name text not null,
  description text not null default '',
  starting_price numeric(12,2) check (starting_price is null or starting_price >= 0),
  pricing_unit text not null default 'per_project' check (pricing_unit in ('per_design','per_package','per_project','custom')),
  delivery_min_days integer check (delivery_min_days is null or delivery_min_days >= 0),
  delivery_max_days integer check (delivery_max_days is null or delivery_max_days >= delivery_min_days),
  deliverables text[] not null default '{}',
  revisions_included integer not null default 2 check (revisions_included >= 0),
  add_ons jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique default ('AQ-Q-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  enquiry_id bigint references public.enquiries(id) on delete set null,
  client_name text not null,
  client_email text,
  client_whatsapp text,
  project_title text not null,
  project_brief text not null default '',
  status text not null default 'Draft' check (status in ('Draft','Sent','Accepted','Declined','Expired','Cancelled')),
  currency text not null default 'NGN' check (currency = 'NGN'),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0 and discount_amount <= subtotal),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  deposit_percent numeric(5,2) not null default 50 check (deposit_percent >= 0 and deposit_percent <= 100),
  initial_payment_amount numeric(12,2) not null default 0 check (initial_payment_amount >= 0 and initial_payment_amount <= total_amount),
  timeline text,
  revisions_included integer not null default 2 check (revisions_included >= 0),
  valid_until date,
  terms text not null default '50% initial payment is required before production begins. Two reasonable revision rounds are included. Additional scope or revisions are quoted separately. Final files are delivered after the agreed payment terms are fulfilled.',
  sent_at timestamptz,
  accepted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotations_enquiry_id_idx on public.quotations(enquiry_id);
create index if not exists quotations_status_idx on public.quotations(status);
create index if not exists quotations_created_by_idx on public.quotations(created_by);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  service_id uuid references public.service_catalogue(id) on delete set null,
  service_name text not null,
  description text not null default '',
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(14,2) generated always as (quantity * unit_price) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists quotation_items_quotation_id_idx on public.quotation_items(quotation_id);
create index if not exists quotation_items_service_id_idx on public.quotation_items(service_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text,
  transaction_reference text,
  payment_date date not null default current_date,
  status text not null default 'Pending' check (status in ('Pending','Verified','Rejected')),
  notes text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists payments_quotation_id_idx on public.payments(quotation_id);
create index if not exists payments_verified_by_idx on public.payments(verified_by);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  enquiry_id bigint not null references public.enquiries(id) on delete cascade,
  stage text not null check (stage in ('Not started','Brief confirmed','Designing','Client review','Revisions','Ready to deliver','Completed','On hold')),
  message text not null default '',
  client_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists project_updates_enquiry_id_idx on public.project_updates(enquiry_id);
create index if not exists project_updates_created_by_idx on public.project_updates(created_by);

alter table public.service_catalogue enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.payments enable row level security;
alter table public.project_updates enable row level security;

grant select on public.service_catalogue to authenticated;
revoke select on public.service_catalogue from anon;
grant insert, update, delete on public.service_catalogue to authenticated;
grant select, insert, update, delete on public.quotations to authenticated;
grant select, insert, update, delete on public.quotation_items to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.project_updates to authenticated;

drop policy if exists "Public can view active public services" on public.service_catalogue;
drop policy if exists "Admins can view all services" on public.service_catalogue;
create policy "Public can view active public services" on public.service_catalogue
for select to anon using (is_active = true and is_public = true);
create policy "Admins can view all services" on public.service_catalogue
for select to authenticated using ((select public.is_admin()));

-- Anonymous visitors receive column-level access only to fields exposed by the safe public view.
grant select (id, slug, category, name, description, pricing_unit,
              delivery_min_days, delivery_max_days, deliverables,
              revisions_included, sort_order)
on public.service_catalogue to anon;
grant select (is_active, is_public) on public.service_catalogue to anon;

create or replace view public.public_service_catalogue
with (security_invoker = true, security_barrier = true)
as
select id, slug, category, name, description, pricing_unit,
       delivery_min_days, delivery_max_days, deliverables,
       revisions_included, sort_order
from public.service_catalogue
where is_active = true and is_public = true;
revoke all on public.public_service_catalogue from public;
grant select on public.public_service_catalogue to anon, authenticated;
drop policy if exists "Admins can insert services" on public.service_catalogue;
create policy "Admins can insert services" on public.service_catalogue
for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "Admins can update services" on public.service_catalogue;
create policy "Admins can update services" on public.service_catalogue
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins can delete services" on public.service_catalogue;
create policy "Admins can delete services" on public.service_catalogue
for delete to authenticated using ((select public.is_admin()));
drop policy if exists "Admins can manage quotations" on public.quotations;
create policy "Admins can manage quotations" on public.quotations
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins can manage quotation items" on public.quotation_items;
create policy "Admins can manage quotation items" on public.quotation_items
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins can manage payments" on public.payments;
create policy "Admins can manage payments" on public.payments
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins can manage project updates" on public.project_updates;
create policy "Admins can manage project updates" on public.project_updates
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.service_catalogue
(slug,category,name,description,starting_price,pricing_unit,delivery_min_days,delivery_max_days,deliverables,revisions_included,sort_order)
values
('business-logo','Brand Identity','Business logo','A distinctive primary logo for a new or growing business.',10000,'per_project',3,5,array['Primary logo concept','Final approved logo export','Basic colour version'],2,10),
('basic-brand-identity','Brand Identity','Basic brand identity','A coordinated visual identity built around an approved logo direction.',20000,'per_project',5,8,array['Logo design','Colour palette','Typography direction','Basic brand presentation'],2,20),
('starter-business-branding','Brand Identity','Starter business branding','An entry-level identity package for businesses that need a consistent starting point.',25000,'per_package',5,10,array['Logo','Colour and typography direction','Selected business brand assets','Presentation mockup'],2,30),
('social-media-graphic','Digital Design','Social media graphic','One branded social media visual for a post, announcement or promotion.',2500,'per_design',1,2,array['One social media design','Platform-ready export'],2,40),
('social-media-bundle','Digital Design','Social media bundle','A coordinated set of social graphics for a campaign or regular brand communication.',12000,'per_package',3,5,array['Agreed set of social graphics','Consistent visual direction','Platform-ready exports'],2,50),
('simple-flyer','Advertising & Campaigns','Simple flyer','A clean promotional or informational flyer with a clear message and hierarchy.',3000,'per_design',1,2,array['One flyer design','Digital-ready export'],2,60),
('premium-flyer','Advertising & Campaigns','Premium flyer','A more detailed promotional design with stronger visual concept and composition.',5000,'per_design',2,3,array['One premium flyer design','Digital-ready export'],2,70),
('event-birthday-design','Advertising & Campaigns','Event or birthday design','A custom event, celebration or announcement graphic.',3000,'per_design',1,2,array['One event design','Digital-ready export'],2,80),
('product-advertisement','Product Visuals','Product advertisement','A product-focused promotional visual for digital marketing.',5000,'per_design',2,3,array['One product advertisement','Digital-ready export'],2,90),
('product-mockup','Product Visuals','Product mockup','A polished product or brand presentation mockup using supplied assets or an agreed concept.',4000,'per_project',2,4,array['One mockup presentation','High-resolution export'],2,100),
('creative-direction','Creative Direction','Creative direction','Concept development and visual direction for larger or more specialised creative projects.',null,'custom',null,null,array['Creative brief review','Visual direction proposal','Agreed concept deliverables'],2,110)
on conflict (slug) do nothing;

-- Follow-up hardening: non-overlapping service policies and safe admin membership lookup.
drop policy if exists "Admins can manage service catalogue" on public.service_catalogue;
drop policy if exists "Admins can read own membership" on public.admin_users;
create policy "Admins can read own membership" on public.admin_users
for select to authenticated using (user_id = (select auth.uid()));
grant select on public.admin_users to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

notify pgrst, 'reload schema';

-- Remove duplicate legacy policy names if this setup is applied over an earlier preview.
drop policy if exists "Admins manage quotations" on public.quotations;
drop policy if exists "Admins manage quotation items" on public.quotation_items;

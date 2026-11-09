-- AQREVO service catalogue and quotation foundation.
-- Additive only: does not alter existing Envision Studio tables or public website behavior.

create extension if not exists pgcrypto;
create sequence if not exists public.aqrevo_quote_number_seq start 1;

create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  department text not null,
  description text not null default '',
  starting_price numeric(12,2) not null default 0 check (starting_price >= 0),
  pricing_unit text not null default 'per project',
  delivery_estimate text not null default 'Agreed per brief',
  inclusions text[] not null default '{}',
  revision_rounds smallint not null default 2 check (revision_rounds >= 0),
  add_ons jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  show_publicly boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique default (
    'AQ-Q-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.aqrevo_quote_number_seq')::text, 4, '0')
  ),
  client_name text not null,
  client_email text,
  client_whatsapp text,
  business_name text,
  project_title text not null,
  scope text not null default '',
  delivery_estimate text not null default 'To be agreed',
  revision_rounds smallint not null default 2 check (revision_rounds >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  deposit_percent numeric(5,2) not null default 50 check (deposit_percent >= 0 and deposit_percent <= 100),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  balance_amount numeric(12,2) not null default 0 check (balance_amount >= 0),
  valid_until date,
  terms text not null default 'Two reasonable revision rounds are included unless stated otherwise. Additional work outside the approved scope will be quoted separately. Production begins after the agreed initial payment. Final delivery follows the agreed payment terms.',
  status text not null default 'Draft' check (status in ('Draft','Sent','Accepted','Declined','Expired')),
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  service_id uuid references public.service_catalog(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.service_catalog enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;

drop policy if exists "Admins manage service catalogue" on public.service_catalog;
create policy "Admins manage service catalogue" on public.service_catalog
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage quotations" on public.quotations;
create policy "Admins manage quotations" on public.quotations
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage quotation items" on public.quotation_items;
create policy "Admins manage quotation items" on public.quotation_items
for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.service_catalog to authenticated;
grant select, insert, update, delete on public.quotations to authenticated;
grant select, insert, update, delete on public.quotation_items to authenticated;
grant usage, select on sequence public.aqrevo_quote_number_seq to authenticated;

insert into public.service_catalog
(slug,name,department,description,starting_price,pricing_unit,delivery_estimate,inclusions,revision_rounds,sort_order)
values
('business-logo','Business logo design','Brand Identity','A distinctive primary logo direction for a new or growing business.',10000,'per logo project','3–5 working days',array['Primary logo design','One selected final direction','Web-ready and print-ready exports'],2,10),
('basic-brand-identity','Basic brand identity','Brand Identity','A coordinated visual foundation that helps a business present itself consistently.',20000,'per identity project','5–10 working days',array['Logo direction','Colour palette','Typography pairing','Basic brand presentation'],2,20),
('starter-business-branding','Starter business branding','Brand Identity','A practical starter identity package for an early-stage business.',25000,'per package','7–12 working days',array['Logo design','Colour and typography system','Selected brand assets','Basic brand mockup'],2,30),
('social-media-graphic','Social media graphic','Digital Design','A single branded graphic for a social platform or digital communication.',2500,'per graphic','1–2 working days',array['One social media design','One supplied platform size'],2,40),
('social-media-bundle','Social media bundle','Digital Design','A coordinated set of social graphics for a campaign or regular brand communication.',12000,'per bundle','3–5 working days',array['Up to five coordinated graphics','Consistent visual direction'],2,50),
('simple-flyer','Simple promotional flyer','Advertising & Campaigns','A clean, focused flyer for a straightforward announcement or promotion.',3000,'per flyer','1–2 working days',array['One flyer design','One agreed size'],2,60),
('premium-flyer','Premium promotional flyer','Advertising & Campaigns','A more detailed promotional design with stronger visual art direction.',5000,'per flyer','2–3 working days',array['One premium flyer design','Custom visual composition'],2,70),
('event-birthday-design','Event or birthday design','Advertising & Campaigns','A personalised visual for an event, celebration or announcement.',3000,'per design','1–2 working days',array['One event design','One agreed size'],2,80),
('product-advertisement','Product advertisement','Product Visuals','A product-focused promotional visual designed to communicate key benefits and offers.',5000,'per visual','2–3 working days',array['One product advertisement','One agreed format'],2,90),
('product-mockup','Product mockup','Product Visuals','A presentation mockup that helps clients visualise a product or brand application.',4000,'per mockup','2–3 working days',array['One mockup presentation','One supplied product or brand asset'],2,100),
('business-mockup','Business mockup','Product Visuals','A branded mockup for presenting a business touchpoint or application.',4000,'per mockup','2–4 working days',array['One selected mockup scene','Brand application presentation'],2,110),
('creative-direction','Creative direction','Creative Direction','A custom visual concept and art direction engagement for a defined brief.',0,'custom quotation','Agreed per brief',array['Brief review','Visual concept direction','Scope and deliverables agreed before production'],2,120)
on conflict (slug) do nothing;

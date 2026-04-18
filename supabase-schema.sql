-- Run this in your Supabase project: SQL Editor → New Query → paste → Run

create table if not exists domains (
  id            text primary key,
  name          text not null,
  registrar     text not null,
  purchase_date text not null,
  expiry_date   text not null,
  renewal_cost  numeric(10,2) not null default 0,
  auto_renew    boolean not null default false,
  notes         text not null default '',
  tags          text[] not null default '{}',
  status        text not null default 'safe',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists renewal_records (
  id              text primary key,
  domain_id       text not null references domains(id) on delete cascade,
  renewed_at      timestamptz not null,
  new_expiry_date text not null,
  cost            numeric(10,2) not null,
  notes           text
);

create table if not exists domain_activity (
  id          text primary key,
  domain_id   text not null,
  domain_name text not null,
  type        text not null,
  message     text not null,
  timestamp   timestamptz not null default now()
);

-- Allow public read/write for now (add auth later)
alter table domains enable row level security;
alter table renewal_records enable row level security;
alter table domain_activity enable row level security;

create policy "public access" on domains for all using (true) with check (true);
create policy "public access" on renewal_records for all using (true) with check (true);
create policy "public access" on domain_activity for all using (true) with check (true);

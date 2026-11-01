create table public.prop_hunt_rooms (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  version bigint not null default 0,
  state jsonb not null,
  credentials text[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index prop_hunt_rooms_expires_idx on public.prop_hunt_rooms(expires_at);
alter table public.prop_hunt_rooms enable row level security;
revoke all on public.prop_hunt_rooms from anon, authenticated;
grant select,insert,update,delete on public.prop_hunt_rooms to service_role;
create policy prop_hunt_rooms_server_only on public.prop_hunt_rooms for all to service_role using (true) with check (true);
comment on table public.prop_hunt_rooms is 'Temporary two-player game rooms. Only the room Edge Function may access records; high-entropy member tokens are SHA-256 hashed.';

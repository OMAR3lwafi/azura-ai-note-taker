-- Auth sessions audit table for tracking login/logout events
-- Unit 1.1 Phase 1.1.2 - Core Implementation

create table if not exists public.auth_sessions_audit (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text check (event_type in ('login', 'logout', 'refresh', 'failed_login', '2fa_success', '2fa_failed')) not null,
  ip_address inet,
  user_agent text,
  device_id text,
  platform text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Index for querying user activity
create index if not exists auth_sessions_audit_user_time on public.auth_sessions_audit(user_id, created_at desc);
create index if not exists auth_sessions_audit_event_time on public.auth_sessions_audit(event_type, created_at desc);

-- RLS policies
alter table public.auth_sessions_audit enable row level security;

-- Users can only see their own audit logs
create policy "own_audit_logs" on public.auth_sessions_audit
  for select using (user_id = auth.uid());

-- Service role can insert audit logs
create policy "service_insert_audit" on public.auth_sessions_audit
  for insert with check (true);

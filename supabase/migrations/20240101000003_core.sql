-- Core business tables per PRD (Unit 1.2 Phase 1.2.1)
create extension if not exists vector;
create extension if not exists unaccent;

-- Create immutable wrapper for unaccent (needed for generated columns)
create or replace function public.immutable_unaccent(text) returns text as $$
begin
  return unaccent($1);
end;
$$ language plpgsql immutable;

-- Meetings
create table if not exists public.meetings (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  language text check (language in ('ar','en')) default 'ar',
  tags text[] default '{}',
  project text,
  is_offline bool default false,
  created_at timestamptz default now()
);

-- Segments
create table if not exists public.segments (
  id bigserial primary key,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  speaker_label text,
  start_ms int not null,
  end_ms int not null,
  text text not null,
  lang text default 'ar',
  created_at timestamptz default now()
);

-- Text search vector and indexes
alter table public.segments
  add column if not exists tsv tsvector generated always as (
    to_tsvector('simple', public.immutable_unaccent(coalesce(text,'')))
  ) stored;
create index if not exists segments_tsv_gin on public.segments using gin(tsv);

-- AI Suggestions
create table if not exists public.ai_suggestions (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  kind text check (kind in ('summary','decision','action_item')) not null,
  content jsonb not null,
  source_window int,
  created_at timestamptz default now(),
  model text,
  latency_ms int
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  title text not null,
  assignee text,
  due_date date,
  status text check (status in ('open','done')) default 'open',
  created_at timestamptz default now()
);

-- Assets
create table if not exists public.assets (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  kind text check (kind in ('audio','export_pdf','export_md','export_txt','video_ref')) not null,
  path text not null,
  bytes bigint,
  meta jsonb,
  created_at timestamptz default now()
);

-- Speakers
create table if not exists public.speakers (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  label text not null,
  display_name text,
  color text,
  created_at timestamptz default now()
);

-- Indices
create index if not exists meetings_owner_time on public.meetings(owner_id, started_at desc);
create index if not exists segments_meeting_time on public.segments(meeting_id, start_ms);
create index if not exists ai_suggestions_meeting_time on public.ai_suggestions(meeting_id, created_at desc);
create index if not exists tasks_meeting_status on public.tasks(meeting_id, status);
create index if not exists assets_meeting_kind on public.assets(meeting_id, kind);

-- Embedding vector
alter table public.segments
  add column if not exists embedding vector(1536);
create index if not exists segments_embedding_ivff on public.segments using ivfflat (embedding vector_cosine_ops);

-- RLS
alter table public.meetings enable row level security;
alter table public.segments enable row level security;
alter table public.ai_suggestions enable row level security;
alter table public.tasks enable row level security;
alter table public.assets enable row level security;
alter table public.speakers enable row level security;

-- Policies (owner only)
create policy "own_meetings" on public.meetings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "segments_by_owner" on public.segments
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "ai_by_owner" on public.ai_suggestions
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "tasks_by_owner" on public.tasks
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "assets_by_owner" on public.assets
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "speakers_by_owner" on public.speakers
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

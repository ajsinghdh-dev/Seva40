-- Run once in the connected Supabase project. All data access passes through verified server routes.
begin;
create table if not exists public.seva_committee (
 user_id uuid primary key references auth.users(id) on delete cascade,
 added_at timestamptz not null default now()
);
create table if not exists public.seva_workspace (
 id smallint primary key check(id=1),
 revision bigint not null default 0,
 document jsonb not null,
 updated_at timestamptz not null default now()
);
create table if not exists public.seva_audit (
 id uuid primary key,
 event jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.seva_committee enable row level security;
alter table public.seva_workspace enable row level security;
alter table public.seva_audit enable row level security;
revoke all on public.seva_committee,public.seva_workspace,public.seva_audit from anon,authenticated;
grant select,insert,update,delete on public.seva_committee,public.seva_workspace to service_role;
grant select,insert on public.seva_audit to service_role;
insert into public.seva_workspace(id,document) values(1,$json${"workspace": {"version": 1, "tasks": [], "claims": [], "saved": [], "notices": [], "audit": [], "profile": {"name": "Student", "grade": 10, "school": "", "goal": 40, "targetDate": "2027-06-01", "interests": [], "guardianConsent": false, "schoolConfirmed": false}, "preferences": {"compact": false, "reminders": true, "reducedMotion": false, "theme": "dark"}, "weeklyGoal": 4}, "accounts": {}}$json$::jsonb) on conflict(id) do nothing;
create or replace function public.seva_compare_and_swap(expected_revision bigint,next_document jsonb)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare changed integer; event jsonb;
begin
 update public.seva_workspace set document=next_document,revision=revision+1,updated_at=now() where id=1 and revision=expected_revision;
 get diagnostics changed=row_count;
 if changed=0 then return false; end if;
 event=next_document->'workspace'->'audit'->0;
 if event is not null then
 insert into public.seva_audit(id,event) values((event->>'id')::uuid,event) on conflict(id) do nothing;
 end if;
 return true;
end;$$;
revoke all on function public.seva_compare_and_swap(bigint,jsonb) from public,anon,authenticated;
grant execute on function public.seva_compare_and_swap(bigint,jsonb) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('seva-evidence','seva-evidence',false,4194304,array['image/jpeg']) on conflict(id) do nothing;
-- No public/authenticated storage policy: only verified server routes can upload or issue expiring URLs.
commit;

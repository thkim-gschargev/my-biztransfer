-- ============================================================================
-- 양수도 사업 관제판 — 전체 DB 스키마 (신규 Supabase 프로젝트 초기화용)
-- ----------------------------------------------------------------------------
-- 새 Supabase 프로젝트의 SQL Editor 에 그대로 붙여넣어 실행하면 됩니다.
-- (개별 마이그레이션 파일을 따로 적용할 필요 없음)
--
-- 도메인 매핑:
--   projects   = 양수도 건(딜)    예) 신세계 I&C 양수도, IMK 양수도
--   tasks      = 체크리스트 항목
--     · category = 주관 담당팀(키: tech_support, deal, asset, planning, … 또는 custom_xxxx)
--     · phase    = 양수도 진행 단계 1~5 (표준 체크리스트 Phase)
--   categories = 담당팀 분류(기기 간 동기화)
-- ============================================================================

create extension if not exists pgcrypto;

-- ─── projects ────────────────────────────────────────────────────────────────
create table if not exists projects (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  name        text        not null,
  status      text        not null,
  description text,
  start_date  date,
  target_date date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists projects_user_id_idx on projects (user_id);

-- ─── tasks ───────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users (id) on delete cascade,
  title               text        not null,
  status              text        not null,   -- new|in_progress|waiting|review|hold|delayed|monitoring|done|cancelled
  priority            text        not null,
  category            text        not null,   -- 주관 담당팀 키 또는 custom_xxxxxxxx
  phase               smallint,                -- 양수도 진행 단계 1~5 (표준 체크리스트 Phase)
  project_id          uuid        references projects (id) on delete set null,
  description         text,
  next_action         text,
  assignee_or_partner text,
  charger_model       text,
  due_date            date,
  start_date          date,
  requested_at        timestamptz,
  follow_up_date      date,
  related_link        text,
  memo                text,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on tasks (user_id);
create index if not exists tasks_project_id_idx on tasks (project_id);

-- ─── activity_logs ─────────────────────────────────────────────────────────
-- task_id 는 nullable + ON DELETE SET NULL: 업무 삭제 후에도 "삭제됨" 로그 보존(감사 추적).
create table if not exists activity_logs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  task_id    uuid        references tasks (id) on delete set null,
  type       text        not null,   -- created|updated|deleted|status_changed|completed
  message    text        not null,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_user_id_idx on activity_logs (user_id);
create index if not exists activity_logs_task_id_idx on activity_logs (task_id);

-- ─── categories (기기 간 동기화) ──────────────────────────────────────────────
create table if not exists categories (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  value      text        not null,
  label      text        not null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, value)
);

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table projects      enable row level security;
alter table tasks         enable row level security;
alter table activity_logs enable row level security;
alter table categories    enable row level security;

-- projects
create policy "projects_select_own" on projects for select using (auth.uid() = user_id);
create policy "projects_insert_own" on projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete_own" on projects for delete using (auth.uid() = user_id);

-- tasks
create policy "tasks_select_own" on tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on tasks for delete using (auth.uid() = user_id);

-- activity_logs
create policy "activity_logs_select_own" on activity_logs for select using (auth.uid() = user_id);
create policy "activity_logs_insert_own" on activity_logs for insert with check (auth.uid() = user_id);
create policy "activity_logs_update_own" on activity_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "activity_logs_delete_own" on activity_logs for delete using (auth.uid() = user_id);

-- categories
create policy "categories_select_own" on categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on categories for delete using (auth.uid() = user_id);

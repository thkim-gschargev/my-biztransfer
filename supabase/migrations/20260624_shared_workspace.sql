-- ============================================================================
-- 팀 공유 워크스페이스로 전환
-- ----------------------------------------------------------------------------
-- projects/tasks/activity_logs 의 RLS 를 "본인 소유(auth.uid()=user_id)" 에서
-- "로그인한 팀원 누구나 공유(auth.role()='authenticated')" 로 변경한다.
-- 계정은 관리자가 발급하는 폐쇄형이므로 authenticated = 팀원. user_id 컬럼은
-- 생성자(감사) 기록용으로 그대로 둔다. categories(담당팀)는 사용자별 유지.
--
-- 기존 Supabase 프로젝트의 SQL Editor 에 이 파일을 실행하세요.
-- (새로 schema.sql 을 실행하는 경우 이미 반영되어 있어 불필요)
-- ============================================================================

-- 기존 _own 정책 제거
drop policy if exists "projects_select_own"      on projects;
drop policy if exists "projects_insert_own"      on projects;
drop policy if exists "projects_update_own"      on projects;
drop policy if exists "projects_delete_own"      on projects;
drop policy if exists "tasks_select_own"         on tasks;
drop policy if exists "tasks_insert_own"         on tasks;
drop policy if exists "tasks_update_own"         on tasks;
drop policy if exists "tasks_delete_own"         on tasks;
drop policy if exists "activity_logs_select_own" on activity_logs;
drop policy if exists "activity_logs_insert_own" on activity_logs;
drop policy if exists "activity_logs_update_own" on activity_logs;
drop policy if exists "activity_logs_delete_own" on activity_logs;

-- 공유 정책 생성 (idempotent 하도록 먼저 drop)
drop policy if exists "projects_select_shared"      on projects;
drop policy if exists "projects_insert_shared"      on projects;
drop policy if exists "projects_update_shared"      on projects;
drop policy if exists "projects_delete_shared"      on projects;
drop policy if exists "tasks_select_shared"         on tasks;
drop policy if exists "tasks_insert_shared"         on tasks;
drop policy if exists "tasks_update_shared"         on tasks;
drop policy if exists "tasks_delete_shared"         on tasks;
drop policy if exists "activity_logs_select_shared" on activity_logs;
drop policy if exists "activity_logs_insert_shared" on activity_logs;
drop policy if exists "activity_logs_update_shared" on activity_logs;
drop policy if exists "activity_logs_delete_shared" on activity_logs;

create policy "projects_select_shared" on projects for select using (auth.role() = 'authenticated');
create policy "projects_insert_shared" on projects for insert with check (auth.role() = 'authenticated');
create policy "projects_update_shared" on projects for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "projects_delete_shared" on projects for delete using (auth.role() = 'authenticated');

create policy "tasks_select_shared" on tasks for select using (auth.role() = 'authenticated');
create policy "tasks_insert_shared" on tasks for insert with check (auth.role() = 'authenticated');
create policy "tasks_update_shared" on tasks for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "tasks_delete_shared" on tasks for delete using (auth.role() = 'authenticated');

create policy "activity_logs_select_shared" on activity_logs for select using (auth.role() = 'authenticated');
create policy "activity_logs_insert_shared" on activity_logs for insert with check (auth.role() = 'authenticated');
create policy "activity_logs_update_shared" on activity_logs for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "activity_logs_delete_shared" on activity_logs for delete using (auth.role() = 'authenticated');

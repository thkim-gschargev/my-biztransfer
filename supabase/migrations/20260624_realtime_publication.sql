-- ============================================================================
-- 실시간 동기화: Realtime "Postgres Changes" 활성화
-- ----------------------------------------------------------------------------
-- projects / tasks / activity_logs 를 supabase_realtime publication 에 추가하여
-- INSERT/UPDATE/DELETE 변경 이벤트가 클라이언트로 푸시되도록 한다.
-- (Realtime 은 RLS 를 존중하므로, 공유 정책(auth.role()='authenticated')에 따라
--  로그인한 팀원만 이벤트를 수신한다.)
--
-- 기존 Supabase 프로젝트의 SQL Editor 에 실행하세요. (idempotent — 재실행 안전)
-- categories 는 사용자별이라 실시간 대상에서 제외.
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['projects', 'tasks', 'activity_logs']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

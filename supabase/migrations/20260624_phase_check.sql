-- ============================================================================
-- tasks.phase 범위 제약(1~5) 추가 — DB 레벨에서 TaskPhase(1|2|3|4|5) 불변식 보장
-- 기존 Supabase 프로젝트의 SQL Editor 에 실행하세요. (idempotent)
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_phase_range'
  ) then
    alter table tasks
      add constraint tasks_phase_range check (phase is null or phase between 1 and 5);
  end if;
end $$;

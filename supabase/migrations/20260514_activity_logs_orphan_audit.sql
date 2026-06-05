-- activity_logs.task_id를 nullable로 변환하고, tasks 삭제 시 task_id를 NULL로 세팅.
-- 목적: 업무 삭제 활동 로그가 영구 보존되도록 함 (감사 추적).

ALTER TABLE activity_logs ALTER COLUMN task_id DROP NOT NULL;

ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_task_id_fkey;

ALTER TABLE activity_logs
  ADD CONSTRAINT activity_logs_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

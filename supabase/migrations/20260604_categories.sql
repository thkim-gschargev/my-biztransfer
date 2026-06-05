-- 카테고리를 기기 종속(localStorage)에서 사용자별 Supabase 테이블로 이전.
-- 목적: 여러 기기 간 카테고리 동기화. (적용 전까지 앱은 localStorage 로 그대로 동작)

create table if not exists categories (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  value      text        not null,
  label      text        not null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, value)
);

alter table categories enable row level security;

create policy "categories_select_own"
  on categories for select
  using (auth.uid() = user_id);

create policy "categories_insert_own"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "categories_update_own"
  on categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories_delete_own"
  on categories for delete
  using (auth.uid() = user_id);

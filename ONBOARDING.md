# my-biztransfer — 인수인계 (Onboarding / Handoff)

> 이 문서는 다른 작업자/다른 Claude 세션이 이 프로젝트를 그대로 이어받기 위한 안내서입니다.
> 시크릿(키/비밀번호)은 포함하지 않습니다 — 실제 값은 항상 `.env.local` 또는 Supabase 대시보드에서 확인하세요.

## 1. 한눈에

- **무엇**: 전기차 충전기 운영 사업권 **양수도(讓受渡)** 체크리스트 + 진행현황 대시보드 (GS차지비 내부용, 한국어 UI).
- **상태**: 동작하는 MVP. 로그인 → 양수도 건 선택 → 딜별 대시보드/체크리스트. 관리자 계정 발급 기능 포함. Vercel 배포 중.
- **저장소**: GitHub `thkim-gschargev/my-biztransfer`, 기본 브랜치 `main` (Vercel이 main 자동 배포).
- **스택**: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Supabase(Postgres + Auth + RLS) · @dnd-kit.

## 2. ⚠️ Next.js 16 주의 (AGENTS.md)

이 Next 버전은 학습 데이터와 API/관례가 다를 수 있습니다. 코드 작성 전 반드시
`node_modules/next/dist/docs/` 의 해당 가이드를 먼저 읽으세요. (예: 라우트 핸들러는
`export async function GET/POST(request: Request)`, 동적 params 는 `await ctx.params`)

## 3. 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 이미 있으면 생략
# .env.local 값 채우기 (아래 4번)
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npx tsc --noEmit # 타입체크
npx eslint .     # 린트
```

## 4. 환경변수 (`.env.local`)

| 변수 | 노출 | 용도 | 값 출처 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저 | Supabase 프로젝트 URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저 | anon public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | 관리자 계정 발급(RLS 우회) | Supabase → Settings → API → service_role(secret) |
| `ADMIN_EMAILS` | 서버 전용 | 관리자 이메일(콤마 구분) | 직접 지정 (예: 본인 이메일) |

- `NEXT_PUBLIC_*` 는 **빌드 시점에 번들에 박힘** → 값 변경 시 dev 재시작 / Vercel 재배포 필요.
- `SUPABASE_SERVICE_ROLE_KEY`/`ADMIN_EMAILS` 는 `NEXT_PUBLIC_` 가 아니므로 브라우저에 노출 안 됨. `src/lib/supabase/admin.ts` 는 `server-only` 로 보호.
- `.env.local` 은 `.gitignore` 처리(절대 커밋 금지).

## 5. Supabase 설정

1. **새 Supabase 프로젝트** 사용(다른 앱과 데이터 혼용 금지).
2. SQL Editor 에 `supabase/schema.sql` 전체 실행 (projects/tasks/activity_logs/categories + RLS 정책).
   - 기존에 phase 컬럼 없이 실행했다면 `supabase/migrations/20260605_add_phase.sql`(한 줄: `alter table tasks add column if not exists phase smallint;`) 추가 실행.
3. **이메일 발송은 신뢰 불가**(Supabase 기본 SMTP 제한적). 그래서 **공개 회원가입/이메일 인증을 쓰지 않고** 관리자가 계정을 직접 발급하는 구조.
   - 권장: Authentication → Providers → Email → **"Allow new users to sign up" 끄기**.
4. **최초 관리자 부트스트랩**(앱에 아직 계정이 없을 때, 1회): Authentication → **Users → Add user** → 이메일(= `ADMIN_EMAILS` 와 동일)·비밀번호 + **Auto Confirm User** 체크.

## 6. 도메인 모델 (중요)

원본 앱(`my-work`)의 테이블/타입 이름을 유지한 채 양수도 도메인에 매핑:

| 테이블/필드 | 의미 |
|---|---|
| `projects` | **양수도 건(딜)** — 신세계 I&C / IMK(아이마켓코리아) / 양수도 표준 체크리스트(템플릿) |
| `tasks` | **체크리스트 항목** |
| `tasks.phase` (smallint 1~5) | 진행 **단계**(표준 체크리스트 Phase). `PHASE_LABELS` in `src/lib/constants.ts` |
| `tasks.category` | **주관 담당팀**(키: tech_support, deal, legal, asset … `TASK_CATEGORY_LABELS`) |
| `tasks.assigneeOrPartner` | 협력사/상대(제조사·PG·양도사) |
| `tasks.description` / `memo` | 상세 Action / 비고 |
| `activity_logs` | 변경 이력 |
| `categories` | 담당팀 분류(기기 간 동기화) |

> **⚠️ uuid 주의**: `projects.id`, `tasks.id`, `project_id` 는 **uuid 컬럼**. 시드/삽입 시 반드시 실제 UUID 사용
> (`crypto.randomUUID()`). 과거 문자열 id("biz-sse" 등)로 넣어 INSERT 가 조용히 실패한 버그가 있었음 →
> `src/lib/sample-data.ts` 의 `PROJECT_UUID` 매핑으로 해결됨.

## 7. 핵심 구조 (파일 지도)

```
src/
  proxy.ts                         # Next16 미들웨어(인증 게이트). env 없으면 프로덕션은 fail-closed
  app/
    layout.tsx                     # 루트(서버) + ConditionalShell
    page.tsx                       # 대시보드 (현재 딜로 스코프)
    select/page.tsx                # ★ 로그인 후 "양수도 건 선택" 초기화면(전체화면)
    tasks|board|calendar|waiting/  # 체크리스트/칸반/일정/회신대기 (모두 현재 딜로 스코프)
    projects/page.tsx              # 양수도 건 관리(전체)
    settings/page.tsx              # 데이터 백업/복원/샘플로드 + "팀원 계정 관리"(관리자)
    login/page.tsx                 # 로그인 전용(회원가입/비번찾기 제거됨)
    auth/callback, auth/reset-password # 이메일 흐름 잔재(현재 링크 없음, 무해)
    api/admin/users/route.ts       # ★ 관리자 계정 CRUD (GET/POST/PATCH/DELETE)
  providers/                       # auth, projects, activity-logs, tasks, categories, current-deal
  hooks/                           # 위 provider 재노출 + use-task-dialogs
  components/
    layout/                        # app-shell(게이트), app-header, deal-switcher, sidebar 등
    tasks/ projects/ admin/ common/ calendar/ ui/(shadcn)
  lib/
    supabase/{client,server,admin}.ts   # 브라우저/서버/service-role 클라이언트
    auth/admin-guard.ts            # getCurrentAdmin(): ADMIN_EMAILS 화이트리스트
    sample-data.ts                 # ★ 체크리스트 시드 데이터(아래 9번)
    constants.ts                   # 상태/우선순위/단계(PHASE)/담당팀 라벨·색상
    task-utils.ts date.ts calendar-utils.ts
  types/                           # task.ts(TaskPhase 등), project.ts, activity-log.ts
supabase/schema.sql + migrations/  # DB 스키마
reference/                         # ★ 대외비 원본 자료(gitignore). 체크리스트 출처
```

## 8. 동작 흐름

- **인증**: `proxy.ts` 가 미인증이면 `/login` 으로. 로그인은 이메일+비밀번호 전용.
- **딜 선택 게이트**: 로그인 후 `CurrentDealProvider`(`src/providers/current-deal-provider.tsx`, localStorage `bt:current-deal`)에 선택된 딜이 없으면 `AppShell`→`ShellBody` 가 `/select` 로 보냄. `/select` 는 사이드바 없는 전체화면. 헤더 `DealSwitcher` 로 전환/복귀.
- **스코프**: 대시보드·체크리스트·보드·일정·회신대기는 현재 딜(`projectId === dealId`)로 필터. 신규 항목은 기본적으로 현재 딜에 속함(`use-task-dialogs`, `QuickAddButton`).
- **데이터 계층**: 5개 Context Provider + 낙관적 업데이트/롤백. `LocalMirror` 가 변경분을 localStorage 에 미러(복구용). 벌크 작업(설정 페이지) 후 `window.location.reload` 대신 provider `refresh()` 사용.
- **관리자**: 설정 페이지의 "팀원 계정 관리" 카드(관리자에게만 노출). `/api/admin/users` 가 세션+`ADMIN_EMAILS` 이중 검증 후 service-role 로 계정 발급/비번재설정/삭제.

## 9. 체크리스트 시드 데이터

- `src/lib/sample-data.ts` 가 `reference/` 의 실제 자료(표준 체크리스트 CSV, 신세계·IMK 진행현황, slack 로그)를 바탕으로 구성: **양수도 건 3개 + 약 99개 항목**.
  - 두 워크스트림: `MASTER`(기술 연동/전환 24개) + `MASTER_BIZ`(사업 실사·계약·정산·인허가 15개, slack 기반). 신세계=24+15+고유4, IMK=14, 표준템플릿=24+15.
- **적재 방법**: 로그인 → 설정 → **"체크리스트 데이터 불러오기"** (user_id 로 INSERT). 성공/실패 toast 표시.
- `reference/` 는 **대외비라 gitignore** 됨. 이 폴더가 없으면 시드 데이터의 출처를 확인할 수 없으니, 항목 내용 수정 시 코드(`sample-data.ts`)를 직접 보면 됨.

## 10. 배포 (Vercel)

- main 에 push → 자동 빌드/배포.
- Vercel → Settings → Environment Variables 에 **4개 모두** 등록(Production/Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`.
- env 추가/변경 후에는 **재배포**(새 빌드) 필요. 미설정 시 로그인 화면에 노란 경고 배너 표시.

## 11. 자주 막히는 부분(트러블슈팅)

- **"Failed to fetch" 로그인 실패** → 실행 중인 번들에 Supabase env 미주입. 로컬은 `.env.local` 저장 후 dev 재시작, Vercel 은 env 등록 후 재배포.
- **인증 메일 안 옴** → 정상(기본 SMTP 미신뢰). 관리자가 계정 직접 발급(설정 → 팀원 계정 관리) 또는 Supabase Users 에서 Auto Confirm.
- **"샘플 데이터 불러오기" 무반응** → 과거 uuid 버그(해결됨). 이제 실패 시 toast 로 원인 표시.
- **관리자 카드 안 보임** → `ADMIN_EMAILS` 에 로그인 이메일이 없거나 `SUPABASE_SERVICE_ROLE_KEY` 미설정.

## 12. 컨벤션 / 규칙

- 커밋 메시지 끝에: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **절대 커밋 금지**: `.env.local`(특히 service_role 키), `reference/`(대외비), `recovery/`.
- 새 effect 에서 동기 `setState` 금지(React19 lint) → `void Promise.resolve().then(...)` 패턴 사용(기존 코드 참고).
- localStorage 키 접두사: `bt:` / `bt_` (원본 `wcb` 아님).

## 13. 진행/완료 이력

- 스캐폴딩(my-work 기반) → 도메인 리브랜딩 → 체크리스트 구축 → 6차원 멀티에이전트 코드리뷰 + 수정 → 로그인 전용화 + 관리자 계정 발급 → 샘플로드 uuid 버그 수정 → **양수도 건 선택 초기화면 + 딜 스코프**(최신).
- 검증: 매 단계 `tsc`/`eslint`/`build` 통과.

## 14. 다음 작업 후보 (보류된 리뷰 항목 등)

- L-3: `sample-data.ts` 의 실제 CloudFront URL(대외비 가능성) placeholder 검토.
- L-5: 전면 클라이언트 렌더 구조 → 일부 Server Component 분리(번들/성능).
- L-8: UI 용어 "업무" ↔ 데이터/문서 "체크리스트 항목" 통일.
- L-11/L-12: localStorage 키 구분자 통일, `sample-data.ts` 빌더 중복 정리.
- 기능: 단계별 진행률 위젯(`getPhaseProgress` 유틸 존재), `/projects` 카드 클릭 시 해당 딜로 진입, 커스텀 SMTP(비밀번호 재설정 메일).

---
_최종 갱신: 2026-06-24 기준 / 최신 커밋 `3d576e9`._

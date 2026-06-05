# 양수도 사업 관제판 (my-biztransfer)

전기차(EV) 충전기 운영 사업권 **양수도** 관련 체크리스트 및 업무 진행 현황 대시보드.
`my-work`(Work Control Board)의 기능·디자인·구조를 기반으로 양수도 도메인에 맞게 구성했습니다.

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 4 · shadcn/ui · lucide-react
- Supabase (Postgres + Auth, Row Level Security)
- @dnd-kit (칸반 / 캘린더 / 카테고리 정렬 드래그앤드롭)

## 도메인 모델

| 코드 엔티티 | 의미 | 예시 |
| --- | --- | --- |
| `projects` | 양수도 건(딜) | 신세계 I&C 양수도, IMK 양수도 |
| `tasks` | 체크리스트 항목 | "부지계약 승계 동의서 취합" 등 |
| `category` | 업무 영역 | 자산관리 · 기술연동 · 계약이관 · 정산/결제 · 인허가 · 운영연계 · 협의/커뮤니케이션 |
| `activity_logs` | 변경 이력(감사 추적) | 생성 · 상태변경 · 완료 · 삭제 |

화면(좌측 메뉴): 대시보드 · 체크리스트 · 진행 보드(칸반) · 일정 · 양수도 건 · 회신 대기 · 설정

## 시작하기

### 1) Supabase 준비

`my-work`와 데이터가 섞이지 않도록 **새 Supabase 프로젝트**를 생성합니다.

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. SQL Editor 에 [`supabase/schema.sql`](supabase/schema.sql) 전체를 붙여넣고 실행 (테이블·RLS·정책 생성)
3. Settings → API 에서 Project URL 과 anon public key 확인

### 2) 환경변수

```bash
cp .env.local.example .env.local
# .env.local 의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 실제 값으로 채움
```

### 3) 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

첫 실행 후 회원가입 → 로그인 → 설정(/settings)에서 **샘플 데이터 불러오기**로 구조를 확인할 수 있습니다.

## 참고 자료 (reference/)

양수도 사업 원본 자료가 `reference/` 에 있으며, 이를 토대로 실제 체크리스트를 구축합니다. (대외비 — `.gitignore`로 커밋 제외)

- `양수도 사업 체크리스트/` — 5단계(Phase) 체크리스트 원본
- `IMK 연동 개발 진행 현황/` · `신세계 연동 개발 진행 현황/` — 연동/전환 진행 자료
- `slack 대화방.txt` — 진행 논의 로그

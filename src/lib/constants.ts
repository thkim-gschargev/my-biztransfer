import type { TaskStatus, TaskPriority, TaskPhase } from "@/types/task";
import type { ProjectStatus } from "@/types/project";

// ─── 라벨 ────────────────────────────────────────────────────────────────────

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: "신규",
  in_progress: "진행 중",
  waiting: "회신 대기",
  review: "검토 필요",
  hold: "보류",
  delayed: "지연",
  monitoring: "모니터링",
  done: "완료",
  cancelled: "취소",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "긴급",
  high: "높음",
  normal: "보통",
  low: "낮음",
};

// 카테고리 = 주관 담당팀 (체크리스트의 "담당" 컬럼). 다중 팀이면 주관(첫 번째) 팀 기준.
// (Supabase categories 테이블의 기본 시드값으로도 사용됨)
export const TASK_CATEGORY_LABELS: Record<string, string> = {
  tech_support: "충전기술지원팀",
  tech_planning: "충전기술기획팀",
  platform: "플랫폼개발팀",
  planning: "기획관리팀",
  biz_planning: "경영기획부문",
  deal: "Deal팀",
  legal: "법무팀",
  asset: "구매자산관리팀",
  construction: "네트워크구축관리팀",
  network_sales: "네트워크영업팀",
  network_maint: "네트워크유지보수팀",
  cx: "고객경험팀",
  marketing: "마케팅팀",
  safety: "안전관리팀",
  etc: "기타",
};

// ─── 양수도 진행 단계 (Phase 1~5) ─────────────────────────────────────────────
export const PHASE_LABELS: Record<TaskPhase, string> = {
  1: "1단계 · 사전 준비",
  2: "2단계 · 계약/연동 준비",
  3: "3단계 · 연동개발/전환일정",
  4: "4단계 · 검증/테스트",
  5: "5단계 · 전환 실행",
};

export const PHASE_SHORT_LABELS: Record<TaskPhase, string> = {
  1: "1단계",
  2: "2단계",
  3: "3단계",
  4: "4단계",
  5: "5단계",
};

export const PHASE_OPTIONS = (Object.keys(PHASE_LABELS) as unknown as TaskPhase[])
  .map((n) => Number(n) as TaskPhase)
  .map((value) => ({ value, label: PHASE_LABELS[value] }));

// Phase 뱃지 색상 (단계별 진행 흐름을 색으로 구분)
export const PHASE_CLASSES: Record<TaskPhase, string> = {
  1: "bg-slate-100  text-slate-700  border-slate-300  dark:bg-slate-800/60  dark:text-slate-300  dark:border-slate-600",
  2: "bg-sky-100    text-sky-700    border-sky-300    dark:bg-sky-900/40    dark:text-sky-300    dark:border-sky-700",
  3: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700",
  4: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700",
  5: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "예정",
  in_progress: "진행 중",
  hold: "보류",
  done: "완료",
  cancelled: "취소",
};

// ─── 셀렉트 옵션 ──────────────────────────────────────────────────────────────

export const TASK_STATUS_OPTIONS = (
  Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]
).map(([value, label]) => ({ value, label }));

export const TASK_PRIORITY_OPTIONS = (
  Object.entries(TASK_PRIORITY_LABELS) as [TaskPriority, string][]
).map(([value, label]) => ({ value, label }));

export const PROJECT_STATUS_OPTIONS = (
  Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]
).map(([value, label]) => ({ value, label }));

// ─── Badge 색상 className ─────────────────────────────────────────────────────

export const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
  new:        "bg-slate-100  text-slate-600  border-slate-300  dark:bg-slate-800/60  dark:text-slate-300  dark:border-slate-600",
  in_progress:"bg-blue-100   text-blue-700   border-blue-300   dark:bg-blue-900/40   dark:text-blue-300   dark:border-blue-700",
  waiting:    "bg-amber-100  text-amber-700  border-amber-300  dark:bg-amber-900/40  dark:text-amber-300  dark:border-amber-700",
  review:     "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700",
  hold:       "bg-gray-100   text-gray-500   border-gray-300   dark:bg-gray-800/60   dark:text-gray-400   dark:border-gray-600",
  delayed:    "bg-red-100    text-red-700    border-red-300    dark:bg-red-900/40    dark:text-red-300    dark:border-red-700",
  monitoring: "bg-teal-100   text-teal-700   border-teal-300   dark:bg-teal-900/40   dark:text-teal-300   dark:border-teal-700",
  done:       "bg-green-100  text-green-700  border-green-300  dark:bg-green-900/40  dark:text-green-300  dark:border-green-700",
  cancelled:  "bg-muted      text-muted-foreground border-border",
};

export const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
  planned:    "bg-slate-100  text-slate-600  border-slate-300  dark:bg-slate-800/60  dark:text-slate-300  dark:border-slate-600",
  in_progress:"bg-blue-100   text-blue-700   border-blue-300   dark:bg-blue-900/40   dark:text-blue-300   dark:border-blue-700",
  hold:       "bg-amber-100  text-amber-700  border-amber-300  dark:bg-amber-900/40  dark:text-amber-300  dark:border-amber-700",
  done:       "bg-green-100  text-green-700  border-green-300  dark:bg-green-900/40  dark:text-green-300  dark:border-green-700",
  cancelled:  "bg-muted      text-muted-foreground border-border",
};

// ─── 상태 점(dot) 색상 — pill 안 선두 점으로 스캔 가독성 향상 ────────────────────
export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  new:        "bg-slate-400  dark:bg-slate-500",
  in_progress:"bg-blue-500",
  waiting:    "bg-amber-500",
  review:     "bg-violet-500",
  hold:       "bg-gray-400   dark:bg-gray-500",
  delayed:    "bg-red-500",
  monitoring: "bg-teal-500",
  done:       "bg-green-500",
  cancelled:  "bg-muted-foreground/40",
};

// ─── 우선순위: 점 + 텍스트(지표형) — 상태 pill 과 형태를 다르게 ────────────────
export const TASK_PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: "bg-red-500",
  high:   "bg-orange-500",
  normal: "bg-sky-500",
  low:    "bg-slate-300 dark:bg-slate-600",
};

export const TASK_PRIORITY_TEXT: Record<TaskPriority, string> = {
  urgent: "text-red-600    dark:text-red-400    font-semibold",
  high:   "text-orange-600 dark:text-orange-400 font-medium",
  normal: "text-foreground",
  low:    "text-muted-foreground",
};

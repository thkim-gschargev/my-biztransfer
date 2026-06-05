import type { TaskStatus, TaskPriority } from "@/types/task";
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

// 양수도 사업 업무 영역(카테고리) — 체크리스트 분류 기준.
// (Supabase categories 테이블의 기본 시드값으로도 사용됨)
export const TASK_CATEGORY_LABELS: Record<string, string> = {
  asset_mgmt: "자산관리",
  tech_integration: "기술연동",
  contract: "계약이관",
  settlement: "정산/결제",
  license: "인허가",
  operation: "운영연계",
  communication: "협의/커뮤니케이션",
  etc: "기타",
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

export const TASK_CATEGORY_OPTIONS = Object.entries(TASK_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

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

export const TASK_PRIORITY_CLASSES: Record<TaskPriority, string> = {
  urgent: "bg-red-100    text-red-700    border-red-300    dark:bg-red-900/40    dark:text-red-300    dark:border-red-700",
  high:   "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
  normal: "bg-slate-100  text-slate-600  border-slate-300  dark:bg-slate-800/60  dark:text-slate-300  dark:border-slate-600",
  low:    "bg-gray-50    text-gray-400   border-gray-200   dark:bg-gray-900/60   dark:text-gray-500   dark:border-gray-700",
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

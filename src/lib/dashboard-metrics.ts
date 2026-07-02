import type { Task, TaskPhase } from "@/types/task";
import type { Project } from "@/types/project";
import { daysDiff, isPastDue, waitingDays } from "@/lib/date";

export const ALL_PHASES: TaskPhase[] = [1, 2, 3, 4, 5];

/** 취소 제외 활성 항목 여부 */
const isActive = (t: Task) => t.status !== "cancelled";

/** 항목을 상호배타 4버킷으로 분류 → 표/지표 합계가 정확히 일치한다. */
export type TaskBucket = "done" | "delayed" | "inProgress" | "pending";
export function classifyTask(t: Task): TaskBucket {
  if (t.status === "done") return "done";
  if (t.status === "delayed" || isPastDue(t.dueDate)) return "delayed";
  if (t.status === "in_progress") return "inProgress";
  return "pending"; // new · waiting · review · monitoring · hold
}

// ─── 전체 진행률 ──────────────────────────────────────────────────────────────

export interface OverallProgress {
  total: number; // 취소 제외 전체
  done: number;
  delayed: number;
  inProgress: number;
  pending: number;
  waiting: number; // status = waiting (pending의 부분집합)
  review: number; // status = review (pending의 부분집합)
  rate: number; // 완료율 0~100
}

export function getOverallProgress(tasks: Task[]): OverallProgress {
  const active = tasks.filter(isActive);
  const c = { done: 0, delayed: 0, inProgress: 0, pending: 0 };
  for (const t of active) c[classifyTask(t)]++;
  // waiting/review는 pending 버킷의 부분집합으로만 카운트 →
  // 마감 초과된 회신대기·검토 항목이 '지연'과 동시에 이중 계상되지 않는다.
  const waiting = active.filter(
    (t) => t.status === "waiting" && classifyTask(t) === "pending",
  ).length;
  const review = active.filter(
    (t) => t.status === "review" && classifyTask(t) === "pending",
  ).length;
  return {
    total: active.length,
    done: c.done,
    delayed: c.delayed,
    inProgress: c.inProgress,
    pending: c.pending,
    waiting,
    review,
    rate: active.length ? Math.round((c.done / active.length) * 100) : 0,
  };
}

// ─── 단계(Phase)별 진행 ───────────────────────────────────────────────────────

export interface PhaseRow {
  phase: TaskPhase | 0; // 0 = 단계 미지정
  total: number;
  done: number;
  inProgress: number;
  pending: number;
  delayed: number;
  rate: number; // 완료율 0~100
}

/** 1~5단계 행 + (있을 때만) 미지정 행. 항목 0개 단계도 행은 유지(전체 흐름 표시). */
export function getPhaseRows(tasks: Task[]): PhaseRow[] {
  const active = tasks.filter(isActive);
  const rows: PhaseRow[] = [];
  for (const phase of [...ALL_PHASES, 0] as (TaskPhase | 0)[]) {
    const inPhase = active.filter((t) => (t.phase ?? 0) === phase);
    if (phase === 0 && inPhase.length === 0) continue; // 미지정 없으면 생략
    const c = { done: 0, delayed: 0, inProgress: 0, pending: 0 };
    for (const t of inPhase) c[classifyTask(t)]++;
    rows.push({
      phase,
      total: inPhase.length,
      done: c.done,
      inProgress: c.inProgress,
      pending: c.pending,
      delayed: c.delayed,
      rate: inPhase.length ? Math.round((c.done / inPhase.length) * 100) : 0,
    });
  }
  return rows;
}

/** 현재 진행 단계 = 아직 완료되지 않은 가장 앞선 단계(항목이 있는 단계 중).
 *  모든 단계가 완료됐으면 null(→ 화면에서 '전체 완료'로 표시). */
export function getCurrentPhase(rows: PhaseRow[]): TaskPhase | null {
  const withTasks = rows.filter((r) => r.phase !== 0 && r.total > 0);
  if (withTasks.length === 0) return null;
  const incomplete = withTasks.find((r) => r.done < r.total);
  return incomplete ? (incomplete.phase as TaskPhase) : null;
}

// ─── 일정 대비 진척 ───────────────────────────────────────────────────────────

export interface SchedulePace {
  hasTarget: boolean;
  daysToTarget: number | null; // D-day (양수 = 남음, 음수 = 초과)
  elapsedRate: number | null; // 일정 소진 % (시작~목표 대비 오늘)
  progressRate: number; // 완료 %
  deltaPP: number | null; // progressRate - elapsedRate (음수 = 뒤처짐)
}

export function getSchedulePace(
  project: Project | undefined,
  progressRate: number,
): SchedulePace {
  const start = project?.startDate;
  const target = project?.targetDate;
  const today = new Date();
  const daysToTarget = target ? daysDiff(today, target) : null;
  let elapsedRate: number | null = null;
  if (start && target) {
    const span = daysDiff(start, target);
    if (span > 0) {
      const elapsed = daysDiff(start, today);
      elapsedRate = Math.min(100, Math.max(0, Math.round((elapsed / span) * 100)));
    }
  }
  return {
    hasTarget: !!target,
    daysToTarget,
    elapsedRate,
    progressRate,
    deltaPP: elapsedRate == null ? null : progressRate - elapsedRate,
  };
}

// ─── 리스크(주의 필요) ────────────────────────────────────────────────────────

export interface RiskItem {
  task: Task;
  severity: "high" | "medium";
  reason: string;
}

/** 지연(초과·delayed) → high, 검토/회신대기/보류 → medium. 심각도·마감순 정렬. */
export function getRiskItems(tasks: Task[]): RiskItem[] {
  const items: RiskItem[] = [];
  for (const t of tasks) {
    if (t.status === "cancelled" || t.status === "done") continue;
    if (t.status === "delayed" || isPastDue(t.dueDate)) {
      const over = t.dueDate ? daysDiff(t.dueDate, new Date()) : 0;
      items.push({ task: t, severity: "high", reason: over > 0 ? `마감 ${over}일 초과` : "지연" });
    } else if (t.status === "review") {
      items.push({ task: t, severity: "medium", reason: "검토 필요" });
    } else if (t.status === "waiting") {
      const wd = waitingDays(t.requestedAt);
      items.push({ task: t, severity: "medium", reason: wd > 0 ? `회신 대기 ${wd}일` : "회신 대기" });
    } else if (t.status === "hold") {
      items.push({ task: t, severity: "medium", reason: "보류" });
    }
  }
  const rank = { high: 0, medium: 1 };
  return items.sort(
    (a, b) =>
      rank[a.severity] - rank[b.severity] ||
      (a.task.dueDate ?? "9999-99-99").localeCompare(b.task.dueDate ?? "9999-99-99"),
  );
}

// ─── 다가오는 주요 일정 ──────────────────────────────────────────────────────

/** 미완료 항목 중 마감일이 오늘 이후인 것들을 가까운 순으로. */
export function getUpcomingMilestones(tasks: Task[], limit = 6): Task[] {
  const today = new Date();
  return tasks
    .filter(
      (t) =>
        t.status !== "done" &&
        t.status !== "cancelled" &&
        t.dueDate &&
        daysDiff(today, t.dueDate) >= 0,
    )
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, limit);
}

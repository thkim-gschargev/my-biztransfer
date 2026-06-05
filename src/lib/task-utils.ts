import type { Task, TaskStatus, TaskPriority, TaskCategory } from "@/types/task";
import { isToday, isThisWeek, isPastDue } from "@/lib/date";

// ─── 날짜 기반 필터 ──────────────────────────────────────────────────────────

export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.status !== "cancelled" &&
      (isToday(t.dueDate) || t.status === "in_progress"),
  );
}

export function getDelayedTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.status !== "cancelled" &&
      (t.status === "delayed" || isPastDue(t.dueDate)),
  );
}

export function getWaitingTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === "waiting");
}

export function getThisWeekDueTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.status !== "cancelled" &&
      isThisWeek(t.dueDate),
  );
}

export function getThisWeekCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => t.status === "done" && isThisWeek(t.completedAt),
  );
}

// ─── 집계 ────────────────────────────────────────────────────────────────────

export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    new: 0,
    in_progress: 0,
    waiting: 0,
    review: 0,
    hold: 0,
    delayed: 0,
    monitoring: 0,
    done: 0,
    cancelled: 0,
  };
  for (const t of tasks) {
    counts[t.status] += 1;
  }
  return counts;
}

/** 프로젝트에 속한 업무 중 완료 비율 (0~100) */
export function getProjectCompletionRate(tasks: Task[], projectId: string): number {
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  if (projectTasks.length === 0) return 0;
  const done = projectTasks.filter((t) => t.status === "done").length;
  return Math.round((done / projectTasks.length) * 100);
}

// ─── 검색 / 필터 ──────────────────────────────────────────────────────────────

export function filterByKeyword(tasks: Task[], keyword: string): Task[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.nextAction?.toLowerCase().includes(q) ||
      t.assigneeOrPartner?.toLowerCase().includes(q) ||
      t.chargerModel?.toLowerCase().includes(q) ||
      t.errorCode?.toLowerCase().includes(q) ||
      t.memo?.toLowerCase().includes(q),
  );
}

export function filterByStatus(tasks: Task[], status: TaskStatus | ""): Task[] {
  if (!status) return tasks;
  return tasks.filter((t) => t.status === status);
}

export function filterByPriority(tasks: Task[], priority: TaskPriority | ""): Task[] {
  if (!priority) return tasks;
  return tasks.filter((t) => t.priority === priority);
}

export function filterByCategory(tasks: Task[], category: TaskCategory | ""): Task[] {
  if (!category) return tasks;
  return tasks.filter((t) => t.category === category);
}

export function filterByProject(tasks: Task[], projectId: string | ""): Task[] {
  if (!projectId) return tasks;
  return tasks.filter((t) => t.projectId === projectId);
}

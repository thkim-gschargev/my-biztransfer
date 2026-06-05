export type TaskStatus =
  | "new"
  | "in_progress"
  | "waiting"
  | "review"
  | "hold"
  | "delayed"
  | "monitoring"
  | "done"
  | "cancelled";

export type TaskPriority = "urgent" | "high" | "normal" | "low";

export type TaskCategory = string;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  projectId?: string;
  assigneeOrPartner?: string;
  chargerModel?: string;
  errorCode?: string;
  relatedLink?: string;
  dueDate?: string;
  startDate?: string;
  nextAction?: string;
  requestedAt?: string;
  followUpDate?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export const ACTIVE_STATUSES: TaskStatus[] = [
  "new",
  "in_progress",
  "waiting",
  "review",
  "hold",
  "delayed",
  "monitoring",
];

export const TERMINAL_STATUSES: TaskStatus[] = ["done", "cancelled"];

export const ALL_STATUSES: TaskStatus[] = [...ACTIVE_STATUSES, ...TERMINAL_STATUSES];

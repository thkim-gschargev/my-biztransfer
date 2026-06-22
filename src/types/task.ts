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

/** 양수도 진행 단계 (1~5). 표준 체크리스트 Phase 와 매핑된다. */
export type TaskPhase = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** 주관 담당팀 (카테고리 키) */
  category: TaskCategory;
  /** 양수도 진행 단계 (Phase 1~5). 미지정 가능. */
  phase?: TaskPhase;
  projectId?: string;
  assigneeOrPartner?: string;
  chargerModel?: string;
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

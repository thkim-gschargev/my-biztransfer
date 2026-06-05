export interface ActivityLog {
  id: string;
  /** task가 삭제된 경우 null. 감사 추적용 (예: "deleted" 로그) */
  taskId: string | null;
  type:
    | "created"
    | "status_changed"
    | "memo_added"
    | "due_date_changed"
    | "completed"
    | "updated"
    | "deleted";
  message: string;
  createdAt: string;
}

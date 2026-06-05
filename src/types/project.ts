export type ProjectStatus =
  | "planned"
  | "in_progress"
  | "hold"
  | "done"
  | "cancelled";

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

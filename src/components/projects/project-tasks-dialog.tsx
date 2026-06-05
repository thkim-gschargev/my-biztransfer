"use client";

import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_CLASSES } from "@/lib/constants";
import { formatDisplayDate, isPastDue } from "@/lib/date";

interface ProjectTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function ProjectTasksDialog({
  open,
  onOpenChange,
  project,
  tasks,
  onTaskClick,
}: ProjectTasksDialogProps) {
  if (!project) return null;

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const active = projectTasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  );
  const terminal = projectTasks.filter(
    (t) => t.status === "done" || t.status === "cancelled",
  );
  const sorted = [...active, ...terminal];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{project.name}</DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge
              variant="outline"
              className={PROJECT_STATUS_CLASSES[project.status]}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              업무 {projectTasks.length}건
            </span>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-1.5 pr-1">
          {sorted.length === 0 ? (
            <div className="py-4">
              <EmptyState title="연결된 업무가 없습니다" />
            </div>
          ) : (
            sorted.map((task) => {
              const isDone =
                task.status === "done" || task.status === "cancelled";
              const overdue = isPastDue(task.dueDate) && !isDone;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onTaskClick(task)}
                  className={[
                    "flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left",
                    "transition-colors hover:bg-accent/50 cursor-pointer",
                    isDone ? "opacity-50" : "",
                    overdue
                      ? "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20"
                      : "bg-card",
                  ].join(" ")}
                >
                  <span
                    className={`text-sm font-medium leading-snug ${isDone ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <TaskStatusBadge status={task.status} />
                    <TaskPriorityBadge priority={task.priority} />
                    {task.dueDate && (
                      <span
                        className={`text-xs ml-auto tabular-nums ${overdue ? "text-red-600 font-medium dark:text-red-400" : "text-muted-foreground"}`}
                      >
                        {formatDisplayDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                  {task.nextAction && (
                    <span className="text-xs text-muted-foreground">
                      → {task.nextAction}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-1">
          <DialogClose render={<Button variant="outline" size="sm" />}>
            닫기
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

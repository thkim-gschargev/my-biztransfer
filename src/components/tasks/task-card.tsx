"use client";

import type { Task } from "@/types/task";
import type { Project } from "@/types/project";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { useCategories } from "@/hooks/use-categories";
import { formatDisplayDate, isPastDue } from "@/lib/date";

interface TaskCardProps {
  task: Task;
  project?: Project;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onComplete: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

export function TaskCard({
  task,
  project,
  onEdit,
  onDelete,
  onStatusChange,
  onComplete,
  onClick,
}: TaskCardProps) {
  const { getCategoryLabel } = useCategories();
  const isDone = task.status === "done" || task.status === "cancelled";
  const overdue = isPastDue(task.dueDate) && !isDone;

  return (
    <Card
      className={`cursor-pointer hover:ring-foreground/20 transition-all ${isDone ? "opacity-60" : ""} ${overdue ? "border-destructive/40" : ""}`}
      onClick={() => onClick?.(task)}
    >
      <CardHeader>
        <CardTitle className={`text-sm leading-tight pr-2 ${isDone ? "line-through" : ""}`}>
          {task.title}
        </CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon className="h-4 w-4" />
              <span className="sr-only">작업 메뉴</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => onStatusChange(task.id, "in_progress")}
              >
                진행 중으로 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(task.id, "waiting")}
              >
                회신 대기로 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onComplete(task.id)}>
                완료 처리
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(task.id, "delayed")}
              >
                지연 처리
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(task.id, "monitoring")}
              >
                모니터링으로 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(task)}>
                수정
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(task)}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <div className="flex flex-wrap gap-1.5">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
        {task.nextAction && (
          <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
            → {task.nextAction}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{getCategoryLabel(task.category)}</span>
          {task.dueDate && (
            <span className={overdue ? "text-destructive font-medium" : ""}>
              {formatDisplayDate(task.dueDate)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {project?.name ?? "미지정"}
        </p>
      </CardContent>
    </Card>
  );
}

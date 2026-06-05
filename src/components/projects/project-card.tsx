"use client";

import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CLASSES,
} from "@/lib/constants";
import { formatDate } from "@/lib/date";

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick?: (project: Project) => void;
}

function computeStats(tasks: Task[], projectId: string) {
  const projectTasks = tasks.filter(
    (t) => t.projectId === projectId && t.status !== "cancelled",
  );
  const done = projectTasks.filter((t) => t.status === "done").length;
  const delayed = projectTasks.filter((t) => t.status === "delayed").length;
  const waiting = projectTasks.filter((t) => t.status === "waiting").length;
  const rate =
    projectTasks.length > 0
      ? Math.round((done / projectTasks.length) * 100)
      : 0;
  return { total: projectTasks.length, done, delayed, waiting, rate };
}

export function ProjectCard({
  project,
  tasks,
  onEdit,
  onDelete,
  onClick,
}: ProjectCardProps) {
  const stats = computeStats(tasks, project.id);

  return (
    <Card
      className="cursor-pointer hover:ring-foreground/20 transition-all"
      onClick={() => onClick?.(project)}
    >
      <CardHeader>
        <CardTitle className="text-sm leading-tight pr-2">
          {project.name}
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
              <DropdownMenuItem onClick={() => onEdit(project)}>
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(project)}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
        {project.description && (
          <CardDescription className="text-xs line-clamp-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <Badge
          variant="outline"
          className={`w-fit ${PROJECT_STATUS_CLASSES[project.status]}`}
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>

        {stats.total > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-medium">
                {stats.done}/{stats.total} ({stats.rate}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
          </div>
        )}

        {(stats.delayed > 0 || stats.waiting > 0) && (
          <div className="flex gap-3 text-xs">
            {stats.delayed > 0 && (
              <span className="text-destructive">
                지연 {stats.delayed}건
              </span>
            )}
            {stats.waiting > 0 && (
              <span className="text-muted-foreground">
                대기 {stats.waiting}건
              </span>
            )}
          </div>
        )}

        {stats.total === 0 && (
          <p className="text-xs text-muted-foreground">연결된 업무 없음</p>
        )}
      </CardContent>
      {project.targetDate && (
        <CardFooter className="text-xs text-muted-foreground">
          목표일: {formatDate(project.targetDate)}
        </CardFooter>
      )}
    </Card>
  );
}

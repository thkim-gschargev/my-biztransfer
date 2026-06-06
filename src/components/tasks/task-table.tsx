"use client";

import type { Task } from "@/types/task";
import type { Project } from "@/types/project";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { useCategories } from "@/hooks/use-categories";
import { PHASE_SHORT_LABELS, PHASE_CLASSES } from "@/lib/constants";
import { formatDisplayDate, isPastDue, daysDiff } from "@/lib/date";

export type SortField =
  | "title" | "status" | "priority" | "phase" | "category"
  | "project" | "assigneeOrPartner" | "nextAction"
  | "dueDate" | "createdAt";

interface TaskTableProps {
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onComplete: (taskId: string) => void;
  onRowClick?: (task: Task) => void;
  sortField?: SortField | null;
  sortDir?: "asc" | "desc";
  onSort?: (field: SortField) => void;
}

function SortableHead({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  field: SortField;
  label: string;
  sortField?: SortField | null;
  sortDir?: "asc" | "desc";
  onSort?: (field: SortField) => void;
  className?: string;
}) {
  const isSortActive = sortField === field;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort?.(field)}
        title={isSortActive ? (sortDir === "asc" ? "내림차순 정렬" : "오름차순 정렬") : "정렬"}
        className={`group inline-flex items-center gap-1 whitespace-nowrap rounded transition-colors ${
          isSortActive ? "text-foreground" : "hover:text-foreground"
        }`}
      >
        <span>{label}</span>
        {isSortActive ? (
          sortDir === "asc" ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : (
            <ChevronDownIcon className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDownIcon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
        )}
      </button>
    </TableHead>
  );
}

export function TaskTable({
  tasks,
  projects,
  onEdit,
  onDelete,
  onStatusChange,
  onComplete,
  onRowClick,
  sortField,
  sortDir,
  onSort,
}: TaskTableProps) {
  const { getCategoryLabel } = useCategories();
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  function headProps(field: SortField) {
    return { field, sortField, sortDir, onSort };
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead {...headProps("title")} label="제목" className="min-w-[160px]" />
            <SortableHead {...headProps("status")} label="상태" className="min-w-[80px]" />
            <SortableHead {...headProps("phase")} label="단계" className="hidden sm:table-cell min-w-[64px]" />
            <SortableHead {...headProps("priority")} label="우선순위" className="hidden sm:table-cell min-w-[80px]" />
            <SortableHead {...headProps("category")} label="담당팀" className="hidden md:table-cell" />
            <SortableHead {...headProps("project")} label="양수도 건" className="hidden md:table-cell" />
            <SortableHead {...headProps("assigneeOrPartner")} label="담당자/협력사" className="hidden lg:table-cell" />
            <SortableHead {...headProps("nextAction")} label="다음 액션" className="hidden lg:table-cell min-w-[140px]" />
            <SortableHead {...headProps("dueDate")} label="마감일" className="hidden sm:table-cell" />
            <SortableHead {...headProps("createdAt")} label="생성일" className="hidden xl:table-cell" />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const project = task.projectId
              ? projectMap.get(task.projectId)
              : undefined;
            const isDone = task.status === "done" || task.status === "cancelled";
            const overdue = isPastDue(task.dueDate) && !isDone;
            // 마감 임박도에 따른 색 강조: 지남/오늘=빨강, 내일=주황
            const dueDiff = task.dueDate ? daysDiff(new Date(), task.dueDate) : null;
            const dueClass =
              isDone || dueDiff === null
                ? "text-muted-foreground"
                : dueDiff <= 0
                  ? "text-destructive font-semibold"
                  : dueDiff === 1
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-muted-foreground";

            return (
              <TableRow
                key={task.id}
                className={`cursor-pointer ${isDone ? "opacity-60" : ""} ${overdue ? "bg-destructive/5" : ""}`}
                onClick={() => onRowClick?.(task)}
              >
                <TableCell className="font-medium max-w-[200px]">
                  <span className={`line-clamp-2 whitespace-normal ${isDone ? "line-through" : ""}`}>
                    {task.title}
                  </span>
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {task.phase ? (
                    <span
                      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium ${PHASE_CLASSES[task.phase]}`}
                    >
                      {PHASE_SHORT_LABELS[task.phase]}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {getCategoryLabel(task.category)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs max-w-[120px] truncate text-muted-foreground">
                  {project?.name ?? "미지정"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {task.assigneeOrPartner ?? "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[160px]">
                  <span className="line-clamp-2 whitespace-pre-wrap">
                    {task.nextAction ?? "-"}
                  </span>
                </TableCell>
                <TableCell className={`hidden sm:table-cell text-xs ${dueClass}`}>
                  {task.dueDate ? formatDisplayDate(task.dueDate) : "-"}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                  {new Date(task.createdAt).toLocaleDateString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">작업 메뉴</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskDialogs } from "@/hooks/use-task-dialogs";
import { useProjects } from "@/hooks/use-projects";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { waitingDays, formatDate, isPastDue } from "@/lib/date";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontalIcon } from "lucide-react";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageTitle } from "@/components/common/page-title";

function getDaysVariant(days: number): "destructive" | "outline" | "secondary" {
  if (days >= 7) return "destructive";
  if (days >= 3) return "outline";
  return "secondary";
}

export default function WaitingPage() {
  const { tasks, updateTask } = useTasks();
  const { projects } = useProjects();
  const { activityLogs } = useActivityLogs();
  const {
    formOpen, setFormOpen,
    detailOpen, setDetailOpen,
    deleteOpen, setDeleteOpen,
    setEditTaskId,
    selectedTaskId,
    editTask, selectedTask,
    openEdit, openDetail, openDelete,
    handleEditOnlySubmit, handleDelete,
    handleStatusChange, handleComplete, handleDuplicate,
  } = useTaskDialogs(tasks);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const waitingTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "waiting")
        .sort((a, b) => {
          const dA = waitingDays(a.requestedAt);
          const dB = waitingDays(b.requestedAt);
          return dB - dA;
        }),
    [tasks],
  );

  const overdueFollowUpCount = useMemo(
    () => waitingTasks.filter((t) => t.followUpDate && isPastDue(t.followUpDate)).length,
    [waitingTasks],
  );

  function handleRecontact(taskId: string) {
    const today = new Date().toISOString().split("T")[0];
    updateTask(taskId, { requestedAt: today });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="회신 대기함"
        description="제조사, 고객 등 외부 회신을 기다리는 업무를 모아 봅니다."
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            대기 <strong className="text-foreground">{waitingTasks.length}</strong>건
          </span>
          {overdueFollowUpCount > 0 && (
            <Badge variant="destructive">
              팔로업 초과 {overdueFollowUpCount}건
            </Badge>
          )}
        </div>
      </PageTitle>

      {waitingTasks.length === 0 ? (
        <EmptyState
          title="회신 대기 업무가 없습니다"
          description="상태가 '회신 대기'인 업무가 없습니다."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">업무명</TableHead>
                <TableHead className="hidden sm:table-cell">요청 대상</TableHead>
                <TableHead className="hidden sm:table-cell">요청일</TableHead>
                <TableHead className="min-w-[80px]">대기 일수</TableHead>
                <TableHead className="hidden md:table-cell">팔로업 예정일</TableHead>
                <TableHead className="hidden lg:table-cell">프로젝트</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[140px]">다음 액션</TableHead>
                <TableHead className="min-w-[180px]">빠른 처리</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitingTasks.map((task) => {
                const days = waitingDays(task.requestedAt);
                const followUpOverdue =
                  task.followUpDate ? isPastDue(task.followUpDate) : false;
                const project = task.projectId
                  ? projectMap.get(task.projectId)
                  : undefined;

                return (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(task)}
                  >
                    <TableCell className="font-medium">
                      <span className="line-clamp-2 whitespace-normal">
                        {task.title}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {task.assigneeOrPartner ?? (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {task.requestedAt ? formatDate(task.requestedAt) : "-"}
                    </TableCell>
                    <TableCell>
                      {task.requestedAt ? (
                        <Badge variant={getDaysVariant(days)}>
                          {days}일
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`hidden md:table-cell text-xs ${followUpOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
                    >
                      {task.followUpDate ? formatDate(task.followUpDate) : "-"}
                      {followUpOverdue && (
                        <span className="ml-1 text-destructive">(!)</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[120px] truncate">
                      {project?.name ?? "미지정"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[180px]">
                      <span className="line-clamp-2 whitespace-normal">
                        {task.nextAction ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleStatusChange(task.id, "in_progress")}
                        >
                          회신 완료
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleRecontact(task.id)}
                        >
                          재문의
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleStatusChange(task.id, "delayed")}
                        >
                          지연
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleComplete(task.id)}
                        >
                          완료
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted">
                          <MoreHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">작업 메뉴</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(task)}>
                            상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEdit(task)}>
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => openDelete(task)}
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
      )}

      {/* Dialogs */}
      <TaskFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditTaskId(undefined);
        }}
        task={editTask}
        projects={projects}
        onSubmit={handleEditOnlySubmit}
      />
      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
        project={
          selectedTask?.projectId
            ? projects.find((p) => p.id === selectedTask.projectId)
            : undefined
        }
        activityLogs={activityLogs}
        onEdit={() => selectedTask && openEdit(selectedTask)}
        onDelete={() => selectedTask && openDelete(selectedTask)}
        onStatusChange={(status) => {
          if (selectedTaskId) handleStatusChange(selectedTaskId, status);
        }}
        onComplete={() => {
          if (selectedTaskId) {
            handleComplete(selectedTaskId);
            setDetailOpen(false);
          }
        }}
        onDuplicate={handleDuplicate}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="업무 삭제"
        description={`"${selectedTask?.title ?? ""}"을(를) 삭제하시겠습니까?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}

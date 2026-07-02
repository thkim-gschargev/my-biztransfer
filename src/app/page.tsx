"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  CalendarCheckIcon,
  TriangleAlertIcon,
  ClockIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  FolderKanbanIcon,
} from "lucide-react";
import { useTaskDialogs } from "@/hooks/use-task-dialogs";
import { TaskQuickAdd } from "@/components/tasks/task-quick-add";
import { useProjects } from "@/hooks/use-projects";
import { useDealTasks } from "@/hooks/use-deal-tasks";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import {
  getTodayTasks,
  getDelayedTasks,
  getWaitingTasks,
  getThisWeekDueTasks,
  getThisWeekCompletedTasks,
} from "@/lib/task-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageTitle } from "@/components/common/page-title";
import type { Task, TaskStatus } from "@/types/task";
import type { Project } from "@/types/project";

// ─── 섹션 컴포넌트 ────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onComplete: (taskId: string) => void;
  onClick: (task: Task) => void;
  emptyText: string;
  viewAllHref: string;
}

function Section({
  title,
  tasks,
  projects,
  onEdit,
  onDelete,
  onStatusChange,
  onComplete,
  onClick,
  emptyText,
  viewAllHref,
}: SectionProps) {
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {tasks.length > 0 && (
          <Link
            href={viewAllHref}
            className="text-xs text-muted-foreground hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>
      {tasks.length === 0 ? (
        <EmptyState title={emptyText} />
      ) : (
        <div className="grid gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              project={
                task.projectId ? projectMap.get(task.projectId) : undefined
              }
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onComplete={onComplete}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 대시보드 ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { tasks, loading, dealId } = useDealTasks();
  const { projects } = useProjects();
  const { activityLogs } = useActivityLogs();
  const router = useRouter();

  // 현재 선택된 양수도 건
  const currentDeal = projects.find((p) => p.id === dealId);
  const {
    formOpen, setFormOpen,
    detailOpen, setDetailOpen,
    deleteOpen, setDeleteOpen,
    setEditTaskId,
    selectedTaskId,
    editTask, selectedTask,
    openAdd, openEdit, openDetail, openDelete,
    handleSubmit, handleQuickAdd, handleDelete,
    handleStatusChange, handleComplete, handleDuplicate,
  } = useTaskDialogs(tasks);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const todayTasks = useMemo(() => getTodayTasks(tasks), [tasks]);
  const delayedTasks = useMemo(() => getDelayedTasks(tasks), [tasks]);
  const waitingTasks = useMemo(() => getWaitingTasks(tasks), [tasks]);
  const weekDueCount = useMemo(() => getThisWeekDueTasks(tasks).length, [tasks]);
  const weekDoneCount = useMemo(
    () => getThisWeekCompletedTasks(tasks).length,
    [tasks],
  );
  const recentTasks = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.status !== "done" && t.status !== "cancelled")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [tasks],
  );

  const summaryCards = [
    {
      label: "오늘 할 일",
      value: todayTasks.length,
      desc: "오늘 처리 예정 업무",
      icon: CalendarCheckIcon,
      tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "지연 업무",
      value: delayedTasks.length,
      desc: "마감 초과 또는 지연 상태",
      icon: TriangleAlertIcon,
      tint: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    {
      label: "회신 대기",
      value: waitingTasks.length,
      desc: "외부 회신 대기 중",
      icon: ClockIcon,
      tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "이번 주 마감",
      value: weekDueCount,
      desc: "이번 주 내 마감 예정",
      icon: CalendarClockIcon,
      tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "이번 주 완료",
      value: weekDoneCount,
      desc: "이번 주 처리 완료",
      icon: CircleCheckIcon,
      tint: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      label: "전체 항목",
      value: tasks.length,
      desc: "이 양수도 건의 전체 체크리스트 항목",
      icon: FolderKanbanIcon,
      tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  ];

  const sharedSectionProps = {
    projects,
    onEdit: openEdit,
    onDelete: openDelete,
    onStatusChange: handleStatusChange,
    onComplete: handleComplete,
    onClick: openDetail,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="대시보드"
        description={
          currentDeal
            ? `${currentDeal.name} · 오늘 처리할 업무와 주요 지표`
            : "오늘 처리해야 하는 업무와 주요 지표를 한눈에 확인합니다."
        }
      >
        <Button size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4" />
          업무 추가
        </Button>
      </PageTitle>

      {/* 요약 카드 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} size="sm">
              <CardContent className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </span>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.tint}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <span className="text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight">
                  {card.value}
                </span>
                <span className="text-xs text-muted-foreground">{card.desc}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 빠른 업무 추가 */}
      <TaskQuickAdd onSubmit={handleQuickAdd} />

      {/* 빈 상태 안내 */}
      {!loading && tasks.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              아직 업무가 없습니다. 업무를 추가하거나 샘플 데이터를 불러오세요.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={openAdd}>
                업무 추가
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/settings")}
              >
                샘플 데이터 불러오기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 하단 목록 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <Section
            title="오늘 해야 할 업무"
            tasks={todayTasks.slice(0, 5)}
            emptyText="오늘 처리할 업무가 없습니다"
            viewAllHref="/tasks"
            {...sharedSectionProps}
          />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Section
            title="지연 업무"
            tasks={delayedTasks.slice(0, 5)}
            emptyText="지연된 업무가 없습니다"
            viewAllHref="/tasks"
            {...sharedSectionProps}
          />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Section
            title="회신 대기 업무"
            tasks={waitingTasks.slice(0, 5)}
            emptyText="회신 대기 업무가 없습니다"
            viewAllHref="/waiting"
            {...sharedSectionProps}
          />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Section
            title="최근 업데이트 업무"
            tasks={recentTasks}
            emptyText="업무가 없습니다"
            viewAllHref="/tasks"
            {...sharedSectionProps}
          />
        </div>
      </div>

      {/* Dialogs */}
      <TaskFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditTaskId(undefined);
        }}
        task={editTask}
        projects={projects}
        onSubmit={handleSubmit}
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
        description={`"${selectedTask?.title ?? ""}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}

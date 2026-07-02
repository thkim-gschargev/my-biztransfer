"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PrinterIcon,
  CircleCheckIcon,
  ActivityIcon,
  TriangleAlertIcon,
  ClockIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useTaskDialogs } from "@/hooks/use-task-dialogs";
import { TaskQuickAdd } from "@/components/tasks/task-quick-add";
import { useProjects } from "@/hooks/use-projects";
import { useDealTasks } from "@/hooks/use-deal-tasks";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { getTodayTasks } from "@/lib/task-utils";
import {
  getOverallProgress,
  getPhaseRows,
  getCurrentPhase,
  getSchedulePace,
  getRiskItems,
  getUpcomingMilestones,
} from "@/lib/dashboard-metrics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageTitle } from "@/components/common/page-title";
import { DealHero } from "@/components/dashboard/deal-hero";
import { PhaseProgressTable } from "@/components/dashboard/phase-progress-table";
import { RiskPanel } from "@/components/dashboard/risk-panel";
import { UpcomingMilestones } from "@/components/dashboard/upcoming-milestones";

export default function DashboardPage() {
  const { tasks, loading, dealId } = useDealTasks();
  const { projects } = useProjects();
  const { activityLogs } = useActivityLogs();
  const router = useRouter();

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

  // ─── 임원용 파생 지표 ────────────────────────────────────────────────────────
  const overall = useMemo(() => getOverallProgress(tasks), [tasks]);
  const phaseRows = useMemo(() => getPhaseRows(tasks), [tasks]);
  const currentPhase = useMemo(() => getCurrentPhase(phaseRows), [phaseRows]);
  const pace = useMemo(
    () => getSchedulePace(currentDeal, overall.rate),
    [currentDeal, overall.rate],
  );
  const riskItems = useMemo(() => getRiskItems(tasks), [tasks]);
  const upcoming = useMemo(() => getUpcomingMilestones(tasks), [tasks]);

  // ─── 운영자용(하단) ─────────────────────────────────────────────────────────
  const todayTasks = useMemo(() => getTodayTasks(tasks), [tasks]);
  const recentTasks = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.status !== "done" && t.status !== "cancelled")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [tasks],
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const kpis = [
    { label: "완료", value: overall.done, icon: CircleCheckIcon, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "진행 중", value: overall.inProgress, icon: ActivityIcon, tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: "지연", value: overall.delayed, icon: TriangleAlertIcon, tint: "bg-red-500/10 text-red-600 dark:text-red-400" },
    { label: "회신 대기", value: overall.waiting, icon: ClockIcon, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { label: "검토 필요", value: overall.review, icon: AlertCircleIcon, tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  ];

  const hasTasks = tasks.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="양수도 진행 현황"
        description={
          currentDeal
            ? `${currentDeal.name} · 전체 진행률·단계·리스크를 한눈에`
            : "전체 진행률·단계·리스크를 한눈에 확인합니다."
        }
      >
        {hasTasks && (
          <Button
            size="sm"
            variant="outline"
            className="print:hidden"
            onClick={() => window.print()}
          >
            <PrinterIcon className="h-4 w-4" />
            보고서 인쇄
          </Button>
        )}
        <Button size="sm" className="print:hidden" onClick={openAdd}>
          <PlusIcon className="h-4 w-4" />
          업무 추가
        </Button>
      </PageTitle>

      {/* 빈 상태 */}
      {!loading && !hasTasks && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
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

      {hasTasks && (
        <>
          {/* ① 히어로: 전체 진행률 링 + 딜 요약 + 일정 대비 + 5단계 레일 */}
          <DealHero
            project={currentDeal}
            overall={overall}
            phaseRows={phaseRows}
            currentPhase={currentPhase}
            pace={pace}
          />

          {/* ② 핵심 지표 스트립 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <Card key={k.label} size="sm">
                  <CardContent className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tint}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xl font-semibold leading-none tabular-nums tracking-tight">
                        {k.value}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {k.label}
                      </span>
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ③ 단계별 진행 현황 (단계 펼치면 업무 목록 → 클릭 시 상세 팝업) */}
          <PhaseProgressTable
            rows={phaseRows}
            tasks={tasks}
            onTaskClick={openDetail}
          />

          {/* ④ 리스크 + 다가오는 일정 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <RiskPanel items={riskItems} onTaskClick={openDetail} />
            <UpcomingMilestones tasks={upcoming} onTaskClick={openDetail} />
          </div>

          {/* ⑤ 실무 상세 (운영자용 · 인쇄 시 숨김) */}
          <div className="print:hidden">
            <Separator className="my-2" />
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                실무 상세
              </h3>
            </div>

            <TaskQuickAdd onSubmit={handleQuickAdd} />

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">오늘 해야 할 업무</h4>
                  <Link
                    href="/tasks"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    전체 보기 →
                  </Link>
                </div>
                {todayTasks.length === 0 ? (
                  <EmptyState title="오늘 처리할 업무가 없습니다" />
                ) : (
                  <div className="grid gap-2">
                    {todayTasks.slice(0, 5).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        project={task.projectId ? projectMap.get(task.projectId) : undefined}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        onStatusChange={handleStatusChange}
                        onComplete={handleComplete}
                        onClick={openDetail}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">최근 업데이트</h4>
                  <Link
                    href="/tasks"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    전체 보기 →
                  </Link>
                </div>
                {recentTasks.length === 0 ? (
                  <EmptyState title="업무가 없습니다" />
                ) : (
                  <div className="grid gap-2">
                    {recentTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        project={task.projectId ? projectMap.get(task.projectId) : undefined}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        onStatusChange={handleStatusChange}
                        onComplete={handleComplete}
                        onClick={openDetail}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
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

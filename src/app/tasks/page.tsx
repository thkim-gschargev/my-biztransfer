"use client";

import { useState, useMemo } from "react";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskDialogs } from "@/hooks/use-task-dialogs";
import { useProjects } from "@/hooks/use-projects";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import {
  filterByKeyword,
  filterByStatus,
  filterByPriority,
  filterByCategory,
  filterByProject,
  filterByPhase,
  getTodayTasks,
  getDelayedTasks,
  getWaitingTasks,
  getThisWeekDueTasks,
} from "@/lib/task-utils";
import {
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  PHASE_LABELS,
  PHASE_OPTIONS,
} from "@/lib/constants";
import { useCategories } from "@/hooks/use-categories";

const STATUS_FILTER_ITEMS = { __all__: "전체 상태", ...TASK_STATUS_LABELS };
const PRIORITY_FILTER_ITEMS = { __all__: "전체 우선순위", ...TASK_PRIORITY_LABELS };
const PHASE_FILTER_ITEMS: Record<string, string> = {
  __all__: "전체 단계",
  ...Object.fromEntries(PHASE_OPTIONS.map((o) => [String(o.value), PHASE_LABELS[o.value]])),
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskTable, type SortField } from "@/components/tasks/task-table";
import { TaskQuickAdd } from "@/components/tasks/task-quick-add";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageTitle } from "@/components/common/page-title";
import type { TaskStatus, TaskPriority, TaskPhase } from "@/types/task";

type QuickFilter = "all" | "today" | "week" | "delayed" | "waiting" | "urgent";

export default function TasksPage() {
  const { tasks, loading } = useTasks();
  const { projects } = useProjects();
  const { activityLogs } = useActivityLogs();
  const { categories } = useCategories();
  const categoryFilterItems = { __all__: "전체 담당팀", ...Object.fromEntries(categories.map((c) => [c.value, c.label])) };
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

  // ─── Filter state ─────────────────────────────────────────────────────────

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [phaseFilter, setPhaseFilter] = useState<TaskPhase | "">("");
  const [projectFilter, setProjectFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const projectFilterItems = useMemo(
    () => ({
      __all__: "전체 양수도 건",
      ...Object.fromEntries(projects.map((p) => [p.id, p.name])),
    }),
    [projects],
  );

  const quickCounts = useMemo(
    () => ({
      today: getTodayTasks(tasks).length,
      week: getThisWeekDueTasks(tasks).length,
      delayed: getDelayedTasks(tasks).length,
      waiting: getWaitingTasks(tasks).length,
      urgent: tasks.filter(
        (t) =>
          t.priority === "urgent" &&
          t.status !== "done" &&
          t.status !== "cancelled",
      ).length,
    }),
    [tasks],
  );

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;

    switch (quickFilter) {
      case "today":
        result = getTodayTasks(result);
        break;
      case "week":
        result = getThisWeekDueTasks(result);
        break;
      case "delayed":
        result = getDelayedTasks(result);
        break;
      case "waiting":
        result = getWaitingTasks(result);
        break;
      case "urgent":
        result = result.filter((t) => t.priority === "urgent");
        break;
    }

    if (hideCompleted) {
      result = result.filter(
        (t) => t.status !== "done" && t.status !== "cancelled",
      );
    }

    result = filterByKeyword(result, searchKeyword);
    if (statusFilter) result = filterByStatus(result, statusFilter);
    if (priorityFilter) result = filterByPriority(result, priorityFilter);
    if (categoryFilter) result = filterByCategory(result, categoryFilter);
    if (phaseFilter) result = filterByPhase(result, phaseFilter);
    if (projectFilter) result = filterByProject(result, projectFilter);

    if (sortField) {
      const PRIORITY_WEIGHT: Record<string, number> = {
        urgent: 4, high: 3, normal: 2, low: 1,
      };
      const STATUS_ORDER = [
        "new", "in_progress", "waiting", "monitoring",
        "delayed", "review", "hold", "done", "cancelled",
      ];
      result = [...result].sort((a, b) => {
        let va: string | number = "";
        let vb: string | number = "";
        switch (sortField) {
          case "title": va = a.title; vb = b.title; break;
          case "status":
            va = STATUS_ORDER.indexOf(a.status);
            vb = STATUS_ORDER.indexOf(b.status);
            break;
          case "priority":
            va = PRIORITY_WEIGHT[a.priority] ?? 0;
            vb = PRIORITY_WEIGHT[b.priority] ?? 0;
            break;
          case "phase": va = a.phase ?? 99; vb = b.phase ?? 99; break;
          case "category": va = a.category ?? ""; vb = b.category ?? ""; break;
          case "project":
            va = projectMap.get(a.projectId ?? "") ?? "";
            vb = projectMap.get(b.projectId ?? "") ?? "";
            break;
          case "assigneeOrPartner":
            va = a.assigneeOrPartner ?? ""; vb = b.assigneeOrPartner ?? ""; break;
          case "nextAction": va = a.nextAction ?? ""; vb = b.nextAction ?? ""; break;
          case "dueDate": va = a.dueDate ?? "9999-99-99"; vb = b.dueDate ?? "9999-99-99"; break;
          case "createdAt": va = a.createdAt; vb = b.createdAt; break;
        }
        const cmp = typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "ko");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [
    tasks,
    quickFilter,
    hideCompleted,
    searchKeyword,
    statusFilter,
    priorityFilter,
    categoryFilter,
    phaseFilter,
    projectFilter,
    sortField,
    sortDir,
    projectMap,
  ]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const hasActiveFilter =
    searchKeyword !== "" ||
    statusFilter !== "" ||
    priorityFilter !== "" ||
    categoryFilter !== "" ||
    phaseFilter !== "" ||
    projectFilter !== "" ||
    quickFilter !== "all" ||
    hideCompleted;

  function resetFilters() {
    setSearchKeyword("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setPhaseFilter("");
    setProjectFilter("");
    setQuickFilter("all");
    setHideCompleted(false);
  }

  // ─── Quick filter button config ────────────────────────────────────────────

  const quickFilterBtns: Array<{ value: QuickFilter; label: string; count?: number }> =
    [
      { value: "all", label: "전체" },
      { value: "today", label: "오늘 할 일", count: quickCounts.today },
      { value: "week", label: "이번 주 마감", count: quickCounts.week },
      { value: "delayed", label: "지연 업무", count: quickCounts.delayed },
      { value: "waiting", label: "회신 대기", count: quickCounts.waiting },
      { value: "urgent", label: "긴급 업무", count: quickCounts.urgent },
    ];

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title="체크리스트"
        description="양수도 체크리스트 항목을 검색하고 관리합니다."
      >
        <Button size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4" />
          업무 추가
        </Button>
      </PageTitle>

      {/* 빠른 필터 */}
      <div className="flex flex-wrap gap-2">
        {quickFilterBtns.map((btn) => (
          <Button
            key={btn.value}
            size="sm"
            variant={quickFilter === btn.value ? "default" : "outline"}
            onClick={() => setQuickFilter(btn.value)}
          >
            {btn.label}
            {btn.count !== undefined && btn.count > 0 && (
              <Badge
                variant={quickFilter === btn.value ? "secondary" : "outline"}
                className="ml-1 text-xs"
              >
                {btn.count}
              </Badge>
            )}
          </Button>
        ))}
        <Button
          size="sm"
          variant={hideCompleted ? "secondary" : "outline"}
          onClick={() => setHideCompleted(!hideCompleted)}
        >
          완료 숨기기
        </Button>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="검색..."
            className="pl-8 w-44"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-3.5 w-3.5" />
              <span className="sr-only">검색 초기화</span>
            </button>
          )}
        </div>

        <div className="w-[130px]">
          <Select
            value={statusFilter || "__all__"}
            onValueChange={(v) =>
              setStatusFilter(!v || v === "__all__" ? "" : (v as TaskStatus))
            }
            items={STATUS_FILTER_ITEMS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">전체 상태</SelectItem>
              {TASK_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[110px]">
          <Select
            value={priorityFilter || "__all__"}
            onValueChange={(v) =>
              setPriorityFilter(!v || v === "__all__" ? "" : (v as TaskPriority))
            }
            items={PRIORITY_FILTER_ITEMS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">전체 우선순위</SelectItem>
              {TASK_PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select
            value={phaseFilter ? String(phaseFilter) : "__all__"}
            onValueChange={(v) =>
              setPhaseFilter(!v || v === "__all__" ? "" : (Number(v) as TaskPhase))
            }
            items={PHASE_FILTER_ITEMS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">전체 단계</SelectItem>
              {PHASE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {PHASE_LABELS[opt.value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select
            value={categoryFilter || "__all__"}
            onValueChange={(v) => setCategoryFilter(!v || v === "__all__" ? "" : v)}
            items={categoryFilterItems}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">전체 담당팀</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {projects.length > 0 && (
          <div className="w-[150px]">
            <Select
              value={projectFilter || "__all__"}
              onValueChange={(v) =>
                setProjectFilter(!v || v === "__all__" ? "" : v)
              }
              items={projectFilterItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">전체 양수도 건</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <XIcon className="h-3.5 w-3.5" />
            초기화
          </Button>
        )}
      </div>

      {/* 빠른 업무 추가 (접기/펼치기) */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowQuickAdd((v) => !v)}
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {showQuickAdd ? (
            <XIcon className="h-3.5 w-3.5" />
          ) : (
            <PlusIcon className="h-3.5 w-3.5" />
          )}
          {showQuickAdd ? "빠른 추가 닫기" : "빠른 추가"}
        </button>
        {showQuickAdd && <TaskQuickAdd onSubmit={handleQuickAdd} />}
      </div>

      {/* 결과 카운트 */}
      <p className="text-xs text-muted-foreground">
        업무 {filteredTasks.length}건
        {hasActiveFilter && tasks.length !== filteredTasks.length && (
          <span> (전체 {tasks.length}건 중)</span>
        )}
      </p>

      {/* 테이블 */}
      {loading ? (
        <EmptyState title="불러오는 중…" />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="해당하는 업무가 없습니다"
          description={
            hasActiveFilter
              ? "필터를 조정하거나 초기화해보세요."
              : "새 업무를 추가해보세요."
          }
        >
          {!hasActiveFilter && (
            <Button size="sm" onClick={openAdd}>
              업무 추가
            </Button>
          )}
        </EmptyState>
      ) : (
        <TaskTable
          tasks={filteredTasks}
          projects={projects}
          onEdit={openEdit}
          onDelete={openDelete}
          onStatusChange={handleStatusChange}
          onComplete={handleComplete}
          onRowClick={openDetail}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
        />
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

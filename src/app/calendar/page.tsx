"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";

import { useTasks } from "@/hooks/use-tasks";
import { useTaskDialogs } from "@/hooks/use-task-dialogs";
import { useProjects } from "@/hooks/use-projects";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageTitle } from "@/components/common/page-title";
import {
  CalendarGrid,
  DayView,
  YearPickerDialog,
  DayTasksDialog,
} from "@/components/calendar/calendar-views";
import {
  DATE_FIELD_LABELS,
  VIEW_MODE_LABELS,
  WEEKDAY_LABELS,
  buildMonthCells,
  buildWeekCells,
  buildCellGridData,
  toYMD,
  addDays,
  type DateField,
  type ViewMode,
} from "@/lib/calendar-utils";
import { TASK_STATUS_CLASSES } from "@/lib/constants";
import type { Task } from "@/types/task";

export default function CalendarPage() {
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
    openAdd, openEdit, openDetail, openDelete,
    handleSubmit, handleDelete,
    handleStatusChange, handleComplete, handleDuplicate,
  } = useTaskDialogs(tasks);

  const [viewDate, setViewDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [dateField, setDateField] = useState<DateField>("dueDate");
  const [showRangeBars, setShowRangeBars] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [dayListDate, setDayListDate] = useState<string | null>(null);
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>(undefined);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const cells = useMemo(() => {
    if (viewMode === "month") return buildMonthCells(viewYear, viewMonth);
    if (viewMode === "week") return buildWeekCells(viewDate);
    return [];
  }, [viewMode, viewYear, viewMonth, viewDate]);

  const gridData = useMemo(
    () =>
      viewMode === "day"
        ? {
            singleByDate: new Map<string, Task[]>(),
            visibleRangeTasks: [] as Task[],
            laneMap: new Map<string, number>(),
            maxLane: -1,
          }
        : buildCellGridData(cells, tasks, dateField, showRangeBars),
    [viewMode, cells, tasks, dateField, showRangeBars],
  );

  // Day-view data (independent of grid cells)
  const dayContents = useMemo(() => {
    if (viewMode !== "day")
      return { singleTasks: [] as Task[], rangeTasks: [] as Task[] };
    const dateStr = toYMD(viewDate);
    const single: Task[] = [];
    const range: Task[] = [];
    for (const t of tasks) {
      const hasRange =
        !!t.startDate &&
        !!t.dueDate &&
        t.startDate.substring(0, 10) !== t.dueDate.substring(0, 10);
      if (showRangeBars && hasRange) {
        const s = t.startDate!.substring(0, 10);
        const e = t.dueDate!.substring(0, 10);
        if (dateStr >= s && dateStr <= e) range.push(t);
      } else {
        const raw = t[dateField];
        if (raw?.substring(0, 10) === dateStr) single.push(t);
      }
    }
    return { singleTasks: single, rangeTasks: range };
  }, [viewMode, viewDate, tasks, dateField, showRangeBars]);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const handlePrev = useCallback(() => {
    setViewDate((d) => {
      if (viewMode === "month") return new Date(d.getFullYear(), d.getMonth() - 1, 1);
      if (viewMode === "week") return addDays(d, -7);
      return addDays(d, -1);
    });
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setViewDate((d) => {
      if (viewMode === "month") return new Date(d.getFullYear(), d.getMonth() + 1, 1);
      if (viewMode === "week") return addDays(d, 7);
      return addDays(d, 1);
    });
  }, [viewMode]);

  const handleGoToday = useCallback(() => {
    setViewDate(new Date());
  }, []);

  function handleSelectYear(y: number) {
    setViewDate((d) => {
      const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
      return new Date(y, d.getMonth(), Math.min(d.getDate(), lastDay));
    });
  }

  function handleAddOnDate(dateStr: string) {
    setDefaultDueDate(dateStr);
    openAdd();
  }
  function handleOpenAdd() {
    setDefaultDueDate(undefined);
    openAdd();
  }
  function handleFormOpenChange(o: boolean) {
    setFormOpen(o);
    if (!o) {
      setEditTaskId(undefined);
      setDefaultDueDate(undefined);
    }
  }

  // ─── DnD ───────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTaskId(active.id as string);
  }
  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over ? (over.id as string) : null);
  }
  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTaskId(null);
    setOverId(null);
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;
    const newDateStr = over.id as string;
    const currentDate = task[dateField]?.substring(0, 10);
    if (currentDate === newDateStr) return;
    updateTask(task.id, { [dateField]: newDateStr });
  }

  const activeTask = activeTaskId
    ? (tasks.find((t) => t.id === activeTaskId) ?? null)
    : null;

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (formOpen || detailOpen || deleteOpen || yearPickerOpen || dayListDate !== null)
        return;
      if (activeTaskId !== null) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "t":
        case "T":
          e.preventDefault();
          handleGoToday();
          break;
        case "m":
        case "M":
          e.preventDefault();
          setViewMode("month");
          break;
        case "w":
        case "W":
          e.preventDefault();
          setViewMode("week");
          break;
        case "d":
        case "D":
          e.preventDefault();
          setViewMode("day");
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    handlePrev, handleNext, handleGoToday,
    formOpen, detailOpen, deleteOpen, yearPickerOpen, dayListDate, activeTaskId,
  ]);

  // ─── Toolbar title ─────────────────────────────────────────────────────────
  const toolbarTitle = useMemo(() => {
    if (viewMode === "month") return `${viewMonth + 1}월`;
    if (viewMode === "week") {
      const ws = addDays(viewDate, -viewDate.getDay());
      const we = addDays(ws, 6);
      return `${ws.getMonth() + 1}월 ${ws.getDate()}일 ~ ${we.getMonth() + 1}월 ${we.getDate()}일`;
    }
    return `${viewMonth + 1}월 ${viewDate.getDate()}일 (${WEEKDAY_LABELS[viewDate.getDay()]})`;
  }, [viewMode, viewMonth, viewDate]);

  const dayListTasks = dayListDate
    ? (gridData.singleByDate.get(dayListDate) ?? [])
    : [];

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title="캘린더"
        description="월/주/일 일정을 확인하고 빠르게 업무를 추가합니다. (← → 이동, T 오늘, M/W/D 모드)"
      >
        <Button size="sm" onClick={handleOpenAdd}>
          <PlusIcon className="h-4 w-4" />
          업무 추가
        </Button>
      </PageTitle>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} aria-label="이전">
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={() => setYearPickerOpen(true)}
          className="px-2 py-1 text-sm font-semibold tabular-nums rounded hover:bg-accent"
        >
          {viewYear}년
        </button>
        <span className="text-sm font-semibold tabular-nums">{toolbarTitle}</span>
        <Button variant="outline" size="sm" onClick={handleNext} aria-label="다음">
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleGoToday}>
          오늘
        </Button>

        <div className="flex items-center rounded-md border ml-2">
          {(Object.keys(VIEW_MODE_LABELS) as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={[
                "px-3 py-1 text-xs first:rounded-l-md last:rounded-r-md border-r last:border-r-0 transition-colors",
                viewMode === m
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              ].join(" ")}
            >
              {VIEW_MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRangeBars}
              onChange={(e) => setShowRangeBars(e.target.checked)}
              className="h-3 w-3"
            />
            범위 막대
          </label>
          <span className="text-xs text-muted-foreground">기준</span>
          <div className="w-[110px]">
            <Select
              value={dateField}
              onValueChange={(v) => v && setDateField(v as DateField)}
              items={DATE_FIELD_LABELS}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(DATE_FIELD_LABELS) as [DateField, string][]).map(
                  ([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Body */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {viewMode === "day" ? (
          <DayView
            viewDate={viewDate}
            singleTasks={dayContents.singleTasks}
            rangeTasks={dayContents.rangeTasks}
            projects={projects}
            onAddOnDate={handleAddOnDate}
            onTaskClick={openDetail}
            onEdit={openEdit}
            onDelete={openDelete}
            onStatusChange={handleStatusChange}
            onComplete={handleComplete}
          />
        ) : (
          <CalendarGrid
            cells={cells}
            data={gridData}
            overId={overId}
            cellMinHeight={viewMode === "week" ? "min-h-[400px]" : "min-h-[110px]"}
            onTaskClick={openDetail}
            onAddOnDate={handleAddOnDate}
            onMoreClick={setDayListDate}
          />
        )}

        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeTask && (
            <div
              className={[
                "text-[11px] text-left truncate px-1.5 py-0.5 rounded border shadow-lg max-w-[220px]",
                TASK_STATUS_CLASSES[activeTask.status],
              ].join(" ")}
            >
              {activeTask.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <YearPickerDialog
        open={yearPickerOpen}
        onOpenChange={setYearPickerOpen}
        currentYear={viewYear}
        onSelect={handleSelectYear}
      />

      <DayTasksDialog
        open={dayListDate !== null}
        onOpenChange={(o) => {
          if (!o) setDayListDate(null);
        }}
        dateStr={dayListDate}
        tasks={dayListTasks}
        onTaskClick={openDetail}
        onAddOnDate={handleAddOnDate}
      />

      <TaskFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        task={editTask}
        projects={projects}
        onSubmit={handleSubmit}
        defaultDueDate={defaultDueDate}
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

"use client";

import { PlusIcon } from "lucide-react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { EmptyState } from "@/components/common/empty-state";
import { TASK_STATUS_CLASSES } from "@/lib/constants";
import {
  WEEKDAY_LABELS,
  MAX_VISIBLE_TASKS,
  toYMD,
  type CalendarCell,
  type CellGridData,
} from "@/lib/calendar-utils";
import type { Task, TaskStatus } from "@/types/task";
import type { Project } from "@/types/project";

// ─── DnD primitives ──────────────────────────────────────────────────────────

function DraggableTaskChip({
  task,
  onClick,
  className,
  children,
}: {
  task: Task;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { task } });
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={onClick}
      title={task.title}
      className={`${className} ${isDragging ? "opacity-30" : ""} touch-none w-full`}
      {...attributes}
      {...listeners}
    >
      {children}
    </button>
  );
}

function DroppableCell({
  cell,
  isOver,
  minHeight,
  children,
}: {
  cell: CalendarCell;
  isOver: boolean;
  minHeight: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: cell.dateStr });
  return (
    <div
      ref={setNodeRef}
      className={[
        "group relative flex flex-col gap-1 p-1.5 border-r border-b last:border-r-0 transition-colors",
        minHeight,
        cell.isCurrentMonth ? "bg-card" : "bg-muted/30",
        isOver ? "bg-accent/40 ring-1 ring-inset ring-accent-foreground/30" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ─── Cell pieces ─────────────────────────────────────────────────────────────

function CellHeader({
  cell,
  onAddOnDate,
}: {
  cell: CalendarCell;
  onAddOnDate: (s: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={[
          "text-xs tabular-nums",
          cell.isToday
            ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold"
            : cell.isCurrentMonth
              ? cell.isWeekend
                ? cell.date.getDay() === 0
                  ? "text-red-500"
                  : "text-blue-500"
                : "text-foreground"
              : "text-muted-foreground/50",
        ].join(" ")}
      >
        {cell.date.getDate()}
      </span>
      <button
        type="button"
        onClick={() => onAddOnDate(cell.dateStr)}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
        title="이 날짜로 업무 추가"
        aria-label="이 날짜로 업무 추가"
      >
        <PlusIcon className="h-3 w-3" />
      </button>
    </div>
  );
}

function RangeBarSegment({
  task,
  isStart,
  isEnd,
  onClick,
}: {
  task: Task;
  isStart: boolean;
  isEnd: boolean;
  onClick: () => void;
}) {
  const done = task.status === "done" || task.status === "cancelled";
  return (
    <button
      type="button"
      onClick={onClick}
      title={task.title}
      className={[
        "block text-[11px] text-left truncate px-1.5 leading-5 h-5 border",
        TASK_STATUS_CLASSES[task.status],
        isStart && isEnd
          ? "rounded-md"
          : isStart
            ? "rounded-l-md"
            : isEnd
              ? "rounded-r-md"
              : "",
        done ? "line-through opacity-70" : "",
      ].join(" ")}
    >
      {task.title}
    </button>
  );
}

function CalendarChip({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const done = task.status === "done" || task.status === "cancelled";
  return (
    <DraggableTaskChip
      task={task}
      onClick={onClick}
      className={[
        "block text-[11px] text-left truncate px-1.5 leading-5 h-5 rounded border",
        TASK_STATUS_CLASSES[task.status],
        done ? "line-through opacity-70" : "",
      ].join(" ")}
    >
      {task.title}
    </DraggableTaskChip>
  );
}

// ─── Calendar grid (used for month and week views) ───────────────────────────

export function CalendarGrid({
  cells,
  data,
  overId,
  cellMinHeight,
  onTaskClick,
  onAddOnDate,
  onMoreClick,
}: {
  cells: CalendarCell[];
  data: CellGridData;
  overId: string | null;
  cellMinHeight: string;
  onTaskClick: (t: Task) => void;
  onAddOnDate: (s: string) => void;
  onMoreClick: (s: string) => void;
}) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={[
              "px-2 py-1.5 text-xs font-medium border-r last:border-r-0",
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "",
            ].join(" ")}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const singles = data.singleByDate.get(cell.dateStr) ?? [];
          const visibleSingles = singles.slice(0, MAX_VISIBLE_TASKS);
          const hidden = singles.length - visibleSingles.length;
          return (
            <DroppableCell
              key={cell.dateStr}
              cell={cell}
              isOver={overId === cell.dateStr}
              minHeight={cellMinHeight}
            >
              <CellHeader cell={cell} onAddOnDate={onAddOnDate} />

              {/* Lane-aligned range bars */}
              {Array.from({ length: data.maxLane + 1 }, (_, lane) => {
                const task = data.visibleRangeTasks.find((t) => {
                  if (data.laneMap.get(t.id) !== lane) return false;
                  const s = t.startDate!.substring(0, 10);
                  const e = t.dueDate!.substring(0, 10);
                  return cell.dateStr >= s && cell.dateStr <= e;
                });
                if (!task) return <div key={`l-${lane}`} className="h-5" />;
                const s = task.startDate!.substring(0, 10);
                const e = task.dueDate!.substring(0, 10);
                return (
                  <RangeBarSegment
                    key={`l-${lane}`}
                    task={task}
                    isStart={cell.dateStr === s}
                    isEnd={cell.dateStr === e}
                    onClick={() => onTaskClick(task)}
                  />
                );
              })}

              {/* Single-date chips */}
              {visibleSingles.map((t) => (
                <CalendarChip key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))}
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={() => onMoreClick(cell.dateStr)}
                  className="text-[11px] text-muted-foreground hover:text-foreground text-left px-1.5"
                >
                  +{hidden}개 더 보기
                </button>
              )}
            </DroppableCell>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day view ────────────────────────────────────────────────────────────────

export function DayView({
  viewDate,
  singleTasks,
  rangeTasks,
  projects,
  onAddOnDate,
  onTaskClick,
  onEdit,
  onDelete,
  onStatusChange,
  onComplete,
}: {
  viewDate: Date;
  singleTasks: Task[];
  rangeTasks: Task[];
  projects: Project[];
  onAddOnDate: (s: string) => void;
  onTaskClick: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onComplete: (id: string) => void;
}) {
  const dateStr = toYMD(viewDate);
  const weekday = WEEKDAY_LABELS[viewDate.getDay()];
  const all = [...rangeTasks, ...singleTasks];
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="rounded-md border p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월{" "}
          {viewDate.getDate()}일 ({weekday})
        </h3>
        <Button size="sm" onClick={() => onAddOnDate(dateStr)}>
          <PlusIcon className="h-4 w-4" />
          이 날짜에 추가
        </Button>
      </div>
      {all.length === 0 ? (
        <EmptyState title="이 날짜에 일정이 없습니다" />
      ) : (
        <div className="grid gap-2">
          {all.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              project={t.projectId ? projectMap.get(t.projectId) : undefined}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onComplete={onComplete}
              onClick={onTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Year picker dialog ──────────────────────────────────────────────────────

export function YearPickerDialog({
  open,
  onOpenChange,
  currentYear,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentYear: number;
  onSelect: (y: number) => void;
}) {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => thisYear - 12 + i);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>연도 선택</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-1.5">
          {years.map((y) => {
            const isCurrent = y === currentYear;
            const isThisYear = y === thisYear;
            return (
              <button
                key={y}
                type="button"
                onClick={() => {
                  onSelect(y);
                  onOpenChange(false);
                }}
                className={[
                  "px-2 py-2 text-sm rounded transition-colors",
                  isCurrent
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isThisYear
                      ? "border border-primary/40 hover:bg-accent"
                      : "hover:bg-accent",
                ].join(" ")}
              >
                {y}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Day tasks overflow dialog ───────────────────────────────────────────────

export function DayTasksDialog({
  open,
  onOpenChange,
  dateStr,
  tasks,
  onTaskClick,
  onAddOnDate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  dateStr: string | null;
  tasks: Task[];
  onTaskClick: (t: Task) => void;
  onAddOnDate: (s: string) => void;
}) {
  if (!dateStr) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {dateStr} 업무 {tasks.length}건
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto">
          {tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onTaskClick(t);
                onOpenChange(false);
              }}
              className={[
                "text-sm text-left px-2 py-1.5 rounded border hover:bg-accent",
                TASK_STATUS_CLASSES[t.status],
              ].join(" ")}
            >
              {t.title}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              onAddOnDate(dateStr);
              onOpenChange(false);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            이 날짜에 업무 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

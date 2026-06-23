"use client";

import { useState, useMemo } from "react";
import { PlusIcon } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskDialogs } from "@/hooks/use-task-dialogs";
import { useProjects } from "@/hooks/use-projects";
import { useCurrentDeal } from "@/hooks/use-current-deal";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageTitle } from "@/components/common/page-title";
import { TASK_STATUS_LABELS, TASK_STATUS_CLASSES } from "@/lib/constants";
import type { Task, TaskStatus } from "@/types/task";
import type { Project } from "@/types/project";

const BOARD_COLUMNS: Array<{ status: TaskStatus; dimmed: boolean }> = [
  { status: "new", dimmed: false },
  { status: "in_progress", dimmed: false },
  { status: "waiting", dimmed: false },
  { status: "monitoring", dimmed: false },
  { status: "delayed", dimmed: false },
  { status: "review", dimmed: false },
  { status: "hold", dimmed: false },
  { status: "done", dimmed: true },
  { status: "cancelled", dimmed: true },
];

const DROP_ANIMATION = {
  duration: 220,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
};

// ─── Draggable task wrapper ───────────────────────────────────────────────────

interface DraggableTaskCardProps {
  task: Task;
  project?: Project;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onComplete: (taskId: string) => void;
  onClick: (task: Task) => void;
}

function DraggableTaskCard({ task, ...cardProps }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none transition-opacity duration-150 ${isDragging ? "opacity-30" : "opacity-100"}`}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} {...cardProps} />
    </div>
  );
}

// ─── Droppable column ─────────────────────────────────────────────────────────

interface DroppableColumnProps {
  status: TaskStatus;
  isOver: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}

function DroppableColumn({ status, isOver, isEmpty, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex flex-col gap-2 min-h-20 rounded-lg p-1 -m-1",
        "transition-all duration-150",
        isOver
          ? "bg-accent/60 ring-2 ring-inset ring-accent-foreground/20"
          : "",
        isOver && isEmpty
          ? "pb-10"
          : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ─── Board page ───────────────────────────────────────────────────────────────

export default function BoardPage() {
  const { tasks: allTasks, changeTaskStatus } = useTasks();
  const { projects } = useProjects();
  const { dealId } = useCurrentDeal();
  const { activityLogs } = useActivityLogs();
  const tasks = useMemo(
    () => allTasks.filter((t) => t.projectId === dealId),
    [allTasks, dealId],
  );
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

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const activeTask = activeTaskId
    ? (tasks.find((t) => t.id === activeTaskId) ?? null)
    : null;

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      new: [], in_progress: [], waiting: [], review: [],
      hold: [], delayed: [], monitoring: [], done: [], cancelled: [],
    };
    for (const task of tasks) map[task.status].push(task);
    return map;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
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
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;
    changeTaskStatus(active.id as string, newStatus);
  }

  const sharedCardProps = {
    onEdit: openEdit,
    onDelete: openDelete,
    onStatusChange: handleStatusChange,
    onComplete: handleComplete,
    onClick: openDetail,
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title="칸반 보드"
        description="상태별 업무 흐름을 한눈에 확인합니다."
      >
        <Button size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4" />
          업무 추가
        </Button>
      </PageTitle>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {BOARD_COLUMNS.map(({ status, dimmed }) => {
              const columnTasks = tasksByStatus[status];
              const isOver = overId === status;

              return (
                <div
                  key={status}
                  className={`flex flex-col gap-2 w-60 ${dimmed ? "opacity-50" : ""}`}
                >
                  <div className={[
                    "flex items-center gap-2 py-1.5 border-b transition-colors duration-150",
                    isOver ? "border-accent-foreground/30" : "",
                  ].join(" ")}>
                    <Badge
                      variant="outline"
                      className={TASK_STATUS_CLASSES[status]}
                    >
                      {TASK_STATUS_LABELS[status]}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {columnTasks.length}
                    </span>
                  </div>

                  <DroppableColumn
                    status={status}
                    isOver={isOver}
                    isEmpty={columnTasks.length === 0}
                  >
                    {columnTasks.length === 0 ? (
                      <p className={[
                        "text-xs text-center py-6 transition-colors duration-150",
                        isOver ? "text-muted-foreground/70" : "text-muted-foreground",
                      ].join(" ")}>
                        없음
                      </p>
                    ) : (
                      columnTasks.map((task) => (
                        <DraggableTaskCard
                          key={task.id}
                          task={task}
                          project={
                            task.projectId ? projectMap.get(task.projectId) : undefined
                          }
                          {...sharedCardProps}
                        />
                      ))
                    )}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {activeTask && (
            <div className="w-60 rotate-[1.5deg] shadow-2xl">
              <TaskCard
                task={activeTask}
                project={
                  activeTask.projectId ? projectMap.get(activeTask.projectId) : undefined
                }
                {...sharedCardProps}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
        description={`"${selectedTask?.title ?? ""}"을(를) 삭제하시겠습니까?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}

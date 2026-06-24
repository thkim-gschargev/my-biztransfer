"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Task, TaskStatus } from "@/types/task";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useActivityLogs } from "@/providers/activity-logs-provider";
import { toast } from "@/lib/toast";

export type CreateTaskInput = Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">;
export type UpdateTaskInput = Partial<Omit<Task, "id" | "createdAt">>;

function now(): string {
  return new Date().toISOString();
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    category: row.category as Task["category"],
    ...(row.phase != null && { phase: Number(row.phase) as Task["phase"] }),
    ...(row.project_id != null && { projectId: row.project_id as string }),
    ...(row.description != null && { description: row.description as string }),
    ...(row.next_action != null && { nextAction: row.next_action as string }),
    ...(row.assignee_or_partner != null && { assigneeOrPartner: row.assignee_or_partner as string }),
    ...(row.charger_model != null && { chargerModel: row.charger_model as string }),
    ...(row.due_date != null && { dueDate: (row.due_date as string).substring(0, 10) }),
    ...(row.start_date != null && { startDate: (row.start_date as string).substring(0, 10) }),
    ...(row.requested_at != null && { requestedAt: row.requested_at as string }),
    ...(row.follow_up_date != null && { followUpDate: (row.follow_up_date as string).substring(0, 10) }),
    ...(row.related_link != null && { relatedLink: row.related_link as string }),
    ...(row.memo != null && { memo: row.memo as string }),
    ...(row.completed_at != null && { completedAt: row.completed_at as string }),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function taskToRow(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    category: task.category,
    phase: task.phase ?? null,
    project_id: task.projectId ?? null,
    description: task.description ?? null,
    next_action: task.nextAction ?? null,
    assignee_or_partner: task.assigneeOrPartner ?? null,
    charger_model: task.chargerModel ?? null,
    due_date: task.dueDate ?? null,
    start_date: task.startDate ?? null,
    requested_at: task.requestedAt ?? null,
    follow_up_date: task.followUpDate ?? null,
    related_link: task.relatedLink ?? null,
    memo: task.memo ?? null,
    completed_at: task.completedAt ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

function inputToRow(input: UpdateTaskInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const fields: [keyof UpdateTaskInput, string][] = [
    ["title", "title"], ["status", "status"], ["priority", "priority"],
    ["category", "category"], ["phase", "phase"], ["projectId", "project_id"], ["description", "description"],
    ["nextAction", "next_action"], ["assigneeOrPartner", "assignee_or_partner"],
    ["chargerModel", "charger_model"],
    ["dueDate", "due_date"], ["startDate", "start_date"],
    ["requestedAt", "requested_at"], ["followUpDate", "follow_up_date"],
    ["relatedLink", "related_link"], ["memo", "memo"], ["completedAt", "completed_at"],
  ];
  for (const [from, to] of fields) {
    if (from in input) row[to] = (input as Record<string, unknown>)[from] ?? null;
  }
  return row;
}

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  addTask: (input: CreateTaskInput) => Task;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  changeTaskStatus: (id: string, status: TaskStatus) => void;
  completeTask: (id: string) => void;
  duplicateTask: (id: string) => Task | null;
  getTaskById: (id: string) => Task | undefined;
  refresh: () => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { userId, loading: authLoading } = useAuth();
  const { addActivityLog } = useActivityLogs();
  const tasksRef = useRef<Task[]>([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (authLoading) return; // 인증 확인 전에는 로딩 상태 유지
    let active = true;
    if (!userId) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setTasks([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }
    void (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        console.error("[TasksProvider] SELECT error:", error);
        toast.error("업무 목록을 불러오지 못했습니다.");
      }
      if (data) setTasks((data as Record<string, unknown>[]).map(rowToTask));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId, authLoading, supabase]);

  const addTask = useCallback(
    (input: CreateTaskInput): Task => {
      const ts = now();
      const task: Task = { ...input, id: crypto.randomUUID(), createdAt: ts, updatedAt: ts };
      setTasks((prev) => [task, ...prev]); // 낙관적 추가
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return task;
      }
      void (async () => {
        const { error } = await supabase.from("tasks").insert(taskToRow(task, userId));
        if (error) {
          console.error("[TasksProvider] INSERT error:", error);
          setTasks((prev) => prev.filter((t) => t.id !== task.id)); // 롤백
          toast.error("업무 저장에 실패했습니다.");
          return;
        }
        void addActivityLog({ taskId: task.id, type: "created", message: `업무 생성: ${task.title}`, createdAt: now() });
      })();
      return task;
    },
    [supabase, userId, addActivityLog],
  );

  const updateTask = useCallback(
    (id: string, input: UpdateTaskInput): void => {
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      const prevTask = tasksRef.current.find((t) => t.id === id);
      const ts = now();
      const row: Record<string, unknown> = { ...inputToRow(input), updated_at: ts };
      // 편집 폼으로 status 를 바꿀 때도 completedAt 정합성 유지 (changeTaskStatus 와 동일 규칙)
      let completedPatch: Partial<Task> = {};
      if (input.status !== undefined && prevTask) {
        if (input.status === "done" && prevTask.status !== "done") {
          const completedAt = prevTask.completedAt ?? ts;
          row.completed_at = completedAt;
          completedPatch = { completedAt };
        } else if (input.status !== "done" && prevTask.status === "done") {
          row.completed_at = null;
          completedPatch = { completedAt: undefined };
        }
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...input, ...completedPatch, id, updatedAt: ts } : t)),
      ); // 낙관적 수정
      void (async () => {
        const { error, count } = await supabase
          .from("tasks")
          .update(row, { count: "exact" })
          .eq("id", id);
        if (error || count === 0) {
          console.error("[TasksProvider] UPDATE error:", error ?? "0 rows (RLS?)");
          if (prevTask) setTasks((prev) => prev.map((t) => (t.id === id ? prevTask : t))); // 롤백
          toast.error("업무 수정에 실패했습니다.");
          return;
        }
        void addActivityLog({ taskId: id, type: "updated", message: "업무 정보 수정", createdAt: now() });
      })();
    },
    [supabase, userId, addActivityLog],
  );

  const deleteTask = useCallback(
    (id: string): void => {
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      const snapshot = tasksRef.current;
      const task = snapshot.find((t) => t.id === id);
      const title = task?.title ?? id;
      setTasks((prev) => prev.filter((t) => t.id !== id)); // 낙관적 삭제
      void (async () => {
        // 삭제 로그를 먼저 기록(태스크가 아직 존재하는 시점). 이후 태스크 삭제 시
        // FK 의 ON DELETE SET NULL 로 task_id 가 NULL 처리되어 감사 로그가 보존됩니다.
        await addActivityLog({ taskId: id, type: "deleted", message: `업무 삭제: ${title}`, createdAt: now() });
        const { error, count } = await supabase
          .from("tasks")
          .delete({ count: "exact" })
          .eq("id", id);
        if (error || count === 0) {
          console.error("[TasksProvider] DELETE error:", error ?? "0 rows (RLS?)");
          setTasks(() => snapshot); // 롤백
          toast.error("업무 삭제에 실패했습니다.");
        }
      })();
    },
    [supabase, userId, addActivityLog],
  );

  const changeTaskStatus = useCallback(
    (id: string, status: TaskStatus): void => {
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      const prevTask = tasksRef.current.find((t) => t.id === id);
      if (!prevTask || prevTask.status === status) return;
      const ts = now();
      const updateData: Record<string, unknown> = { status, updated_at: ts };
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          if (status === "done") {
            updateData.completed_at = t.completedAt ?? ts;
            return { ...t, status, updatedAt: ts, completedAt: t.completedAt ?? ts };
          }
          if (t.status === "done") {
            updateData.completed_at = null;
            const { completedAt: _c, ...rest } = t;
            void _c;
            return { ...rest, status, updatedAt: ts };
          }
          return { ...t, status, updatedAt: ts };
        }),
      ); // 낙관적 상태 변경
      void (async () => {
        const { error, count } = await supabase
          .from("tasks")
          .update(updateData, { count: "exact" })
          .eq("id", id);
        if (error || count === 0) {
          console.error("[TasksProvider] STATUS UPDATE error:", error ?? "0 rows (RLS?)");
          setTasks((prev) => prev.map((t) => (t.id === id ? prevTask : t))); // 롤백
          toast.error("상태 변경에 실패했습니다.");
          return;
        }
        void addActivityLog({
          taskId: id,
          type: "status_changed",
          message: `상태 변경: ${TASK_STATUS_LABELS[prevTask.status]} → ${TASK_STATUS_LABELS[status]}`,
          createdAt: now(),
        });
      })();
    },
    [supabase, userId, addActivityLog],
  );

  const completeTask = useCallback(
    (id: string): void => {
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      const prevTask = tasksRef.current.find((t) => t.id === id);
      if (!prevTask) return;
      const ts = now();
      const completedAt = prevTask.completedAt ?? ts;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: "done" as TaskStatus, completedAt, updatedAt: ts }
            : t,
        ),
      ); // 낙관적 완료
      void (async () => {
        const { error, count } = await supabase
          .from("tasks")
          .update({ status: "done", completed_at: completedAt, updated_at: ts }, { count: "exact" })
          .eq("id", id);
        if (error || count === 0) {
          console.error("[TasksProvider] COMPLETE UPDATE error:", error ?? "0 rows (RLS?)");
          setTasks((prev) => prev.map((t) => (t.id === id ? prevTask : t))); // 롤백
          toast.error("완료 처리에 실패했습니다.");
          return;
        }
        void addActivityLog({ taskId: id, type: "completed", message: "업무 완료", createdAt: now() });
      })();
    },
    [supabase, userId, addActivityLog],
  );

  const duplicateTask = useCallback(
    (id: string): Task | null => {
      const original = tasksRef.current.find((t) => t.id === id);
      if (!original) return null;
      const ts = now();
      const duplicate: Task = {
        ...original,
        id: crypto.randomUUID(),
        title: `[복사] ${original.title}`,
        status: "new",
        createdAt: ts,
        updatedAt: ts,
        completedAt: undefined,
      };
      setTasks((prev) => [duplicate, ...prev]); // 낙관적 복제
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return duplicate;
      }
      void (async () => {
        const { error } = await supabase.from("tasks").insert(taskToRow(duplicate, userId));
        if (error) {
          console.error("[TasksProvider] DUPLICATE INSERT error:", error);
          setTasks((prev) => prev.filter((t) => t.id !== duplicate.id)); // 롤백
          toast.error("업무 복제에 실패했습니다.");
          return;
        }
        void addActivityLog({ taskId: duplicate.id, type: "created", message: `업무 복제: ${duplicate.title}`, createdAt: now() });
      })();
      return duplicate;
    },
    [supabase, userId, addActivityLog],
  );

  const getTaskById = useCallback(
    (id: string): Task | undefined => tasks.find((t) => t.id === id),
    [tasks],
  );

  // 벌크 작업(샘플 로드/백업 복원/초기화) 후 전체 페이지 새로고침 없이 재동기화하기 위한 refetch
  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) {
      setTasks([]);
      return;
    }
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[TasksProvider] refresh SELECT error:", error);
      return;
    }
    if (data) setTasks((data as Record<string, unknown>[]).map(rowToTask));
  }, [supabase, userId]);

  const value = useMemo(
    () => ({ tasks, loading, addTask, updateTask, deleteTask, changeTaskStatus, completeTask, duplicateTask, getTaskById, refresh }),
    [tasks, loading, addTask, updateTask, deleteTask, changeTaskStatus, completeTask, duplicateTask, getTaskById, refresh],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}

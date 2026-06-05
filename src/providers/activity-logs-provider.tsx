"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ActivityLog } from "@/types/activity-log";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

export type CreateActivityLogInput = Omit<ActivityLog, "id">;

function rowToLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    taskId: (row.task_id as string | null) ?? null,
    type: row.type as ActivityLog["type"],
    message: row.message as string,
    createdAt: row.created_at as string,
  };
}

export function logToRow(log: ActivityLog, userId: string) {
  return {
    id: log.id,
    user_id: userId,
    task_id: log.taskId,
    type: log.type,
    message: log.message,
    created_at: log.createdAt,
  };
}

interface ActivityLogsContextValue {
  activityLogs: ActivityLog[];
  loading: boolean;
  /** 활동 로그를 기록합니다. INSERT 완료까지 기다리려면 반환된 Promise 를 await 하세요. */
  addActivityLog: (input: CreateActivityLogInput) => Promise<void>;
  getLogsByTaskId: (taskId: string) => ActivityLog[];
  refresh: () => Promise<void>;
}

const ActivityLogsContext = createContext<ActivityLogsContextValue | null>(null);

export function ActivityLogsProvider({ children }: { children: ReactNode }) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { userId, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return; // 인증 확인 전에는 로딩 상태 유지
    let active = true;
    if (!userId) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setActivityLogs([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }
    void (async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) console.error("[ActivityLogsProvider] SELECT error:", error);
      if (data) setActivityLogs((data as Record<string, unknown>[]).map(rowToLog));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId, authLoading, supabase]);

  const addActivityLog = useCallback(
    async (input: CreateActivityLogInput): Promise<void> => {
      if (!userId) {
        console.warn("[ActivityLogsProvider] INSERT skipped: userId is null");
        return;
      }
      const log: ActivityLog = { ...input, id: crypto.randomUUID() };
      // 낙관적 추가: 화면에는 즉시 반영
      setActivityLogs((prev) => [log, ...prev]);
      const { error } = await supabase.from("activity_logs").insert(logToRow(log, userId));
      if (error) {
        console.error("[ActivityLogsProvider] INSERT error:", error);
        // 활동 로그는 보조 정보이므로 실패 시 낙관적 항목만 되돌리고 toast 는 생략
        setActivityLogs((prev) => prev.filter((l) => l.id !== log.id));
      }
    },
    [supabase, userId],
  );

  const getLogsByTaskId = useCallback(
    (taskId: string): ActivityLog[] =>
      activityLogs
        .filter((l) => l.taskId === taskId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activityLogs],
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("[ActivityLogsProvider] refresh SELECT error:", error);
    if (data) setActivityLogs((data as Record<string, unknown>[]).map(rowToLog));
  }, [supabase, userId]);

  const value = useMemo(
    () => ({ activityLogs, loading, addActivityLog, getLogsByTaskId, refresh }),
    [activityLogs, loading, addActivityLog, getLogsByTaskId, refresh],
  );

  return <ActivityLogsContext.Provider value={value}>{children}</ActivityLogsContext.Provider>;
}

export function useActivityLogs(): ActivityLogsContextValue {
  const ctx = useContext(ActivityLogsContext);
  if (!ctx) throw new Error("useActivityLogs must be used within ActivityLogsProvider");
  return ctx;
}

"use client";

import { useEffect } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { useAuth } from "@/hooks/use-auth";

// 클라우드(Supabase)가 유실되어도 마지막 동기화 상태를 이 기기에서 복원할 수 있도록,
// 데이터가 로드되거나 변경될 때마다 전체 스냅샷을 localStorage 에 저장한다.
// 스냅샷 형식은 설정 화면의 JSON 가져오기(import)와 동일(BackupData)하여 복원 로직을 공유한다.
export const LOCAL_MIRROR_KEY = "bt:local-mirror";

export function LocalMirror() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { activityLogs, loading: logsLoading } = useActivityLogs();
  const { userId } = useAuth();

  useEffect(() => {
    // 로그인 + 3개 소스 모두 로드 완료 후에만 기록 (로딩/로그아웃 시 빈 배열로 덮어쓰기 방지)
    if (!userId || tasksLoading || projectsLoading || logsLoading) return;
    const snapshot = {
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      projects,
      tasks,
      activityLogs,
    };
    try {
      localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(snapshot));
    } catch {
      // 용량 초과 / 프라이빗 모드 등은 무시
    }
  }, [userId, tasks, projects, activityLogs, tasksLoading, projectsLoading, logsLoading]);

  return null;
}

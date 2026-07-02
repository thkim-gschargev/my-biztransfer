"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useCurrentDeal } from "@/hooks/use-current-deal";

// 현재 선택된 양수도 건(딜)으로 스코프된 체크리스트 항목을 반환.
// 대시보드/체크리스트/보드/일정/회신대기가 동일한 스코핑을 공유하기 위한 단일 소스.
export function useDealTasks() {
  const { tasks: allTasks, loading } = useTasks();
  const { dealId } = useCurrentDeal();
  const tasks = useMemo(
    () => allTasks.filter((t) => t.projectId === dealId),
    [allTasks, dealId],
  );
  return { tasks, allTasks, loading, dealId };
}

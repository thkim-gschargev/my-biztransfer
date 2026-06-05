import { TASK_PRIORITY_LABELS, TASK_PRIORITY_DOT, TASK_PRIORITY_TEXT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

// 상태(pill)와 형태를 구분하기 위해 우선순위는 "색 점 + 텍스트" 지표형으로 표시한다.
export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span className={cn("h-1.5 w-1.5 rounded-full", TASK_PRIORITY_DOT[priority])} />
      <span className={TASK_PRIORITY_TEXT[priority]}>
        {TASK_PRIORITY_LABELS[priority]}
      </span>
    </span>
  );
}

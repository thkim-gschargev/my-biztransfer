import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS, TASK_STATUS_CLASSES, TASK_STATUS_DOT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/task";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", TASK_STATUS_CLASSES[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", TASK_STATUS_DOT[status])} />
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}

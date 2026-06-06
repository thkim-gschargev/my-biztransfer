"use client";

import type { Task, TaskStatus } from "@/types/task";
import type { Project } from "@/types/project";
import type { ActivityLog } from "@/types/activity-log";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { useCategories } from "@/hooks/use-categories";
import { PHASE_LABELS, PHASE_CLASSES } from "@/lib/constants";
import { formatDate, waitingDays } from "@/lib/date";
import {
  PencilIcon,
  Trash2Icon,
  CheckCircle2Icon,
  ClockIcon,
  AlertTriangleIcon,
  ActivityIcon,
  CopyIcon,
} from "lucide-react";

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  project?: Project;
  activityLogs: ActivityLog[];
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onComplete: () => void;
  onDuplicate?: () => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm whitespace-pre-wrap">{value}</span>
    </div>
  );
}

function LogItem({ log }: { log: ActivityLog }) {
  const date = new Date(log.createdAt);
  const formatted = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-muted-foreground shrink-0 w-16">{formatted}</span>
      <span>{log.message}</span>
    </div>
  );
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  project,
  activityLogs,
  onEdit,
  onDelete,
  onStatusChange,
  onComplete,
  onDuplicate,
}: TaskDetailDialogProps) {
  const { getCategoryLabel } = useCategories();
  if (!task) return null;

  const taskLogs = activityLogs
    .filter((l) => l.taskId === task.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const isDone = task.status === "done" || task.status === "cancelled";

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 pr-2">
            <DialogTitle className="leading-snug text-base">
              {task.title}
            </DialogTitle>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
            {task.phase && (
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${PHASE_CLASSES[task.phase]}`}
              >
                {PHASE_LABELS[task.phase]}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto flex flex-col gap-4 pr-1">
          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-2">
            {!isDone && (
              <>
                <Button size="sm" variant="outline" onClick={onComplete}>
                  <CheckCircle2Icon className="h-3.5 w-3.5" />
                  완료
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange("in_progress")}
                >
                  진행 중
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange("waiting")}
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                  회신 대기
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange("delayed")}
                >
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                  지연
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange("monitoring")}
                >
                  <ActivityIcon className="h-3.5 w-3.5" />
                  모니터링
                </Button>
              </>
            )}
            {onDuplicate && (
              <Button size="sm" variant="outline" onClick={onDuplicate}>
                <CopyIcon className="h-3.5 w-3.5" />
                복제
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onEdit}>
              <PencilIcon className="h-3.5 w-3.5" />
              수정
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2Icon className="h-3.5 w-3.5" />
              삭제
            </Button>
          </div>

          <Separator />

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailRow
              label="담당팀"
              value={getCategoryLabel(task.category)}
            />
            <DetailRow label="양수도 건" value={project?.name} />
            <DetailRow label="담당자 / 협력사" value={task.assigneeOrPartner} />
            <DetailRow label="충전기 모델" value={task.chargerModel} />
            <DetailRow label="오류 코드" value={task.errorCode} />
          </div>

          {/* 일정 */}
          {(task.dueDate ||
            task.startDate ||
            task.requestedAt ||
            task.followUpDate) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailRow label="시작일" value={formatDate(task.startDate)} />
                <DetailRow label="마감일" value={formatDate(task.dueDate)} />
                {task.requestedAt && (
                  <DetailRow
                    label="요청일"
                    value={`${formatDate(task.requestedAt)} (${waitingDays(task.requestedAt)}일 경과)`}
                  />
                )}
                <DetailRow
                  label="팔로업 예정일"
                  value={formatDate(task.followUpDate)}
                />
              </div>
            </>
          )}

          {/* 내용 */}
          {(task.description || task.nextAction || task.relatedLink || task.memo) && (
            <>
              <Separator />
              <div className="flex flex-col gap-3">
                <DetailRow label="업무 설명" value={task.description} />
                <DetailRow label="다음 액션" value={task.nextAction} />
                {task.relatedLink && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">
                      관련 링크
                    </span>
                    <a
                      href={task.relatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline underline-offset-2 break-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.relatedLink}
                    </a>
                  </div>
                )}
                <DetailRow label="메모" value={task.memo} />
              </div>
            </>
          )}

          {/* 활동 로그 */}
          {taskLogs.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  활동 기록
                </span>
                {taskLogs.map((log) => (
                  <LogItem key={log.id} log={log} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <DialogClose render={<Button variant="outline" size="sm" />}>
            닫기
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

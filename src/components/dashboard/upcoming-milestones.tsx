"use client";

import { CalendarClockIcon, InboxIcon } from "lucide-react";
import Link from "next/link";
import type { Task } from "@/types/task";
import { PHASE_SHORT_LABELS, TASK_CATEGORY_LABELS } from "@/lib/constants";
import { daysDiff, formatDate } from "@/lib/date";

function metaLine(task: Task): string {
  const parts: string[] = [];
  if (task.phase) parts.push(PHASE_SHORT_LABELS[task.phase]);
  parts.push(TASK_CATEGORY_LABELS[task.category] ?? task.category);
  if (task.assigneeOrPartner) parts.push(task.assigneeOrPartner);
  return parts.join(" · ");
}

function dday(dueDate: string): { text: string; urgent: boolean } {
  const d = daysDiff(new Date(), dueDate);
  if (d === 0) return { text: "D-DAY", urgent: true };
  return { text: `D-${d}`, urgent: d <= 7 };
}

export function UpcomingMilestones({
  tasks,
  onTaskClick,
  viewAllHref = "/calendar",
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  viewAllHref?: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <CalendarClockIcon className="h-4 w-4 text-violet-500" />
        <h3 className="text-sm font-semibold">다가오는 주요 일정</h3>
        {tasks.length > 0 && (
          <Link
            href={viewAllHref}
            className="ml-auto text-xs text-muted-foreground hover:underline"
          >
            일정 보기 →
          </Link>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <InboxIcon className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            예정된 마감 일정이 없습니다.
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {tasks.map((task) => {
            const { text, urgent } = dday(task.dueDate!);
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onTaskClick(task)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex w-14 shrink-0 flex-col items-center">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        urgent ? "text-violet-600 dark:text-violet-400" : ""
                      }`}
                    >
                      {text}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(task.dueDate).slice(5)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 border-l pl-3">
                    <span className="block truncate text-sm font-medium">
                      {task.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {metaLine(task)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

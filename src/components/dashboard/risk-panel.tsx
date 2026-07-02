"use client";

import { TriangleAlertIcon, CircleCheckIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { Task } from "@/types/task";
import type { RiskItem } from "@/lib/dashboard-metrics";
import { PHASE_SHORT_LABELS, TASK_CATEGORY_LABELS } from "@/lib/constants";

function metaLine(task: Task): string {
  const parts: string[] = [];
  if (task.phase) parts.push(PHASE_SHORT_LABELS[task.phase]);
  parts.push(TASK_CATEGORY_LABELS[task.category] ?? task.category);
  if (task.assigneeOrPartner) parts.push(task.assigneeOrPartner);
  return parts.join(" · ");
}

export function RiskPanel({
  items,
  onTaskClick,
  viewAllHref = "/tasks",
  limit = 6,
}: {
  items: RiskItem[];
  onTaskClick: (task: Task) => void;
  viewAllHref?: string;
  limit?: number;
}) {
  const shown = items.slice(0, limit);
  const more = items.length - shown.length;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <TriangleAlertIcon
          className={`h-4 w-4 ${items.length ? "text-red-500" : "text-muted-foreground"}`}
        />
        <h3 className="text-sm font-semibold">주의 필요</h3>
        {items.length > 0 && (
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
            {items.length}
          </span>
        )}
        {items.length > 0 && (
          <Link
            href={viewAllHref}
            className="ml-auto text-xs text-muted-foreground hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <CircleCheckIcon className="h-8 w-8 text-emerald-500" />
          <p className="text-sm text-muted-foreground">
            현재 주의가 필요한 항목이 없습니다.
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {shown.map(({ task, severity, reason }) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onTaskClick(task)}
                className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    severity === "high" ? "bg-red-500" : "bg-amber-500"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {task.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {metaLine(task)}
                  </span>
                </span>
                <span
                  className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    severity === "high"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {reason}
                </span>
              </button>
            </li>
          ))}
          {more > 0 && (
            <li>
              <Link
                href={viewAllHref}
                className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/50 hover:underline"
              >
                외 {more}건 더 보기
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

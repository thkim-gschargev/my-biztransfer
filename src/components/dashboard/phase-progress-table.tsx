"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import type { Task, TaskPhase } from "@/types/task";
import type { PhaseRow } from "@/lib/dashboard-metrics";
import {
  PHASE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_CLASSES,
  TASK_STATUS_DOT,
} from "@/lib/constants";
import { formatDate } from "@/lib/date";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SEGMENTS: {
  key: keyof Pick<PhaseRow, "done" | "inProgress" | "pending" | "delayed">;
  color: string;
  label: string;
}[] = [
  { key: "done", color: "bg-emerald-500", label: "완료" },
  { key: "inProgress", color: "bg-blue-500", label: "진행" },
  { key: "pending", color: "bg-slate-300 dark:bg-slate-600", label: "대기" },
  { key: "delayed", color: "bg-red-500", label: "지연" },
];

// 단계 상태: 업무 상태 집계 → 시작전 / 진행중 / 완료
type PhaseStatus = "notStarted" | "inProgress" | "done";

const PHASE_STATUS: Record<PhaseStatus, { label: string; cls: string }> = {
  notStarted: { label: "시작전", cls: "bg-muted text-muted-foreground" },
  inProgress: {
    label: "진행중",
    cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  done: {
    label: "완료",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

/** 취소 제외 업무 기준: 전부 완료→완료, 전부 신규→시작전, 그 외→진행중. */
function computePhaseStatus(tasks: Task[]): PhaseStatus | null {
  if (tasks.length === 0) return null;
  if (tasks.every((t) => t.status === "done")) return "done";
  if (tasks.every((t) => t.status === "new")) return "notStarted";
  return "inProgress";
}

// 펼침 목록 내 업무 정렬: 지연 → 진행/검토/대기 → 완료/취소, 그다음 마감·제목순
const STATUS_ORDER: Record<Task["status"], number> = {
  delayed: 0,
  in_progress: 1,
  review: 2,
  waiting: 3,
  monitoring: 4,
  hold: 5,
  new: 6,
  done: 7,
  cancelled: 8,
};

function CompositionBar({ row }: { row: PhaseRow }) {
  if (row.total === 0) {
    return <div className="h-2 w-full rounded-full bg-muted" />;
  }
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {SEGMENTS.map((s) => {
        const n = row[s.key];
        if (n === 0) return null;
        return (
          <div
            key={s.key}
            className={s.color}
            style={{ width: `${(n / row.total) * 100}%` }}
            title={`${s.label} ${n}`}
          />
        );
      })}
    </div>
  );
}

function phaseTitle(phase: TaskPhase | 0): string {
  return phase === 0 ? "단계 미지정" : PHASE_LABELS[phase];
}

function TaskLine({
  task,
  onClick,
}: {
  task: Task;
  onClick: (task: Task) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(task)}
      className="flex w-full items-center gap-2.5 py-2 pl-11 pr-4 text-left transition-colors hover:bg-muted"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${TASK_STATUS_DOT[task.status]}`}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
      {task.assigneeOrPartner && (
        <span className="hidden max-w-[10rem] shrink-0 truncate text-xs text-muted-foreground sm:inline">
          {task.assigneeOrPartner}
        </span>
      )}
      {task.dueDate && (
        <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground md:inline">
          {formatDate(task.dueDate).slice(5)}
        </span>
      )}
      <span
        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${TASK_STATUS_CLASSES[task.status]}`}
      >
        {TASK_STATUS_LABELS[task.status]}
      </span>
    </button>
  );
}

export function PhaseProgressTable({
  rows,
  tasks,
  onTaskClick,
}: {
  rows: PhaseRow[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const tasksByPhase = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const t of tasks) {
      if (t.status === "cancelled") continue;
      const key = t.phase ?? 0;
      const arr = map.get(key);
      if (arr) arr.push(t);
      else map.set(key, [t]);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99") ||
          a.title.localeCompare(b.title),
      );
    }
    return map;
  }, [tasks]);

  const toggle = (phase: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });

  const total = rows.reduce(
    (a, r) => ({
      total: a.total + r.total,
      done: a.done + r.done,
      inProgress: a.inProgress + r.inProgress,
      delayed: a.delayed + r.delayed,
    }),
    { total: 0, done: 0, inProgress: 0, delayed: 0 },
  );
  const totalRate = total.total
    ? Math.round((total.done / total.total) * 100)
    : 0;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">단계별 진행 현황</h3>
        <span className="text-xs text-muted-foreground">· 단계를 눌러 업무 펼치기</span>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          {SEGMENTS.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1">
              <span className={`h-2 w-2 rounded-sm ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">단계</TableHead>
            <TableHead className="text-center">항목</TableHead>
            <TableHead className="text-center">완료</TableHead>
            <TableHead className="text-center">진행</TableHead>
            <TableHead className="text-center">지연</TableHead>
            <TableHead className="w-[34%]">진행률</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const isOpen = expanded.has(r.phase);
            const canExpand = r.total > 0;
            const phaseTasks = tasksByPhase.get(r.phase) ?? [];
            const status = computePhaseStatus(phaseTasks);
            return (
              <Fragment key={r.phase}>
                <TableRow
                  className={canExpand ? "cursor-pointer" : undefined}
                  onClick={canExpand ? () => toggle(r.phase) : undefined}
                  aria-expanded={canExpand ? isOpen : undefined}
                  tabIndex={canExpand ? 0 : undefined}
                  onKeyDown={
                    canExpand
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggle(r.phase);
                          }
                        }
                      : undefined
                  }
                >
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-1.5">
                      <ChevronRightIcon
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                          isOpen ? "rotate-90" : ""
                        } ${canExpand ? "" : "invisible"}`}
                        aria-hidden
                      />
                      {phaseTitle(r.phase)}
                      {status && (
                        <span
                          className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${PHASE_STATUS[status].cls}`}
                        >
                          {PHASE_STATUS[status].label}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {r.total}
                  </TableCell>
                  <TableCell className="text-center font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    {r.done}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.inProgress || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.delayed ? (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {r.delayed}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CompositionBar row={r} />
                      <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums">
                        {r.rate}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>

                {isOpen && canExpand && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="bg-muted/20 p-0">
                      <ul className="divide-y divide-border/60">
                        {phaseTasks.map((t) => (
                          <li key={t.id}>
                            <TaskLine task={t} onClick={onTaskClick} />
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          {/* 합계 */}
          <TableRow className="border-t-2 bg-muted/40 font-semibold hover:bg-muted/40">
            <TableCell>합계</TableCell>
            <TableCell className="text-center tabular-nums">
              {total.total}
            </TableCell>
            <TableCell className="text-center tabular-nums text-emerald-600 dark:text-emerald-400">
              {total.done}
            </TableCell>
            <TableCell className="text-center tabular-nums">
              {total.inProgress || "-"}
            </TableCell>
            <TableCell className="text-center tabular-nums">
              {total.delayed ? (
                <span className="text-red-600 dark:text-red-400">
                  {total.delayed}
                </span>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {totalRate}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

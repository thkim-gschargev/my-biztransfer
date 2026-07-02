"use client";

import type { TaskPhase } from "@/types/task";
import type { PhaseRow } from "@/lib/dashboard-metrics";
import { PHASE_LABELS } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SEGMENTS: { key: keyof Pick<PhaseRow, "done" | "inProgress" | "pending" | "delayed">; color: string; label: string }[] = [
  { key: "done", color: "bg-emerald-500", label: "완료" },
  { key: "inProgress", color: "bg-blue-500", label: "진행" },
  { key: "pending", color: "bg-slate-300 dark:bg-slate-600", label: "대기" },
  { key: "delayed", color: "bg-red-500", label: "지연" },
];

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

export function PhaseProgressTable({
  rows,
  current,
}: {
  rows: PhaseRow[];
  current: TaskPhase | null;
}) {
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
            const isCurrent = r.phase === current;
            return (
              <TableRow
                key={r.phase}
                className={isCurrent ? "bg-primary/5" : undefined}
              >
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    {isCurrent && (
                      <span className="text-primary" aria-label="현재 단계">
                        ▶
                      </span>
                    )}
                    {phaseTitle(r.phase)}
                  </span>
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {r.total}
                </TableCell>
                <TableCell className="text-center font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  {r.done}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {r.inProgress || <span className="text-muted-foreground">-</span>}
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

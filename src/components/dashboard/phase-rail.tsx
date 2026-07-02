"use client";

import { CheckIcon } from "lucide-react";
import type { TaskPhase } from "@/types/task";
import type { PhaseRow } from "@/lib/dashboard-metrics";
import { PHASE_LABELS } from "@/lib/constants";

/** "1단계 · 사전 준비" → "사전 준비" */
function phaseName(phase: TaskPhase): string {
  const label = PHASE_LABELS[phase];
  const parts = label.split("·");
  return (parts[1] ?? parts[0]).trim();
}

/** 양수도 5단계 진행 레일(스텝퍼). 완료=채움, 현재=강조, 예정=흐림. */
export function PhaseRail({
  rows,
  current,
}: {
  rows: PhaseRow[];
  current: TaskPhase | null;
}) {
  const phases = rows.filter((r) => r.phase !== 0) as (PhaseRow & {
    phase: TaskPhase;
  })[];
  if (phases.length === 0) return null;

  return (
    <div className="flex items-start">
      {phases.map((r, i) => {
        const complete = r.total > 0 && r.done === r.total;
        const isCurrent = r.phase === current;
        const started = r.done > 0 || isCurrent;
        const prev = phases[i - 1];
        const prevComplete = prev && prev.total > 0 && prev.done === prev.total;

        return (
          <div
            key={r.phase}
            className="relative flex flex-1 flex-col items-center"
          >
            {/* 이전 노드와 잇는 연결선 */}
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-4 h-0.5 w-full ${
                  prevComplete ? "bg-primary" : "bg-border"
                }`}
                aria-hidden
              />
            )}

            {/* 노드 */}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                complete
                  ? "border-primary bg-primary text-primary-foreground"
                  : isCurrent
                    ? "border-primary bg-background text-primary ring-4 ring-primary/15"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              {complete ? <CheckIcon className="h-4 w-4" /> : r.phase}
            </span>

            {/* 라벨 */}
            <div className="mt-2 px-1 text-center">
              <div
                className={`text-xs font-medium ${started ? "" : "text-muted-foreground"}`}
              >
                {r.phase}단계
                {isCurrent && (
                  <span className="ml-1 text-[10px] font-semibold text-primary">
                    진행
                  </span>
                )}
              </div>
              <div className="text-[11px] leading-tight text-muted-foreground">
                {phaseName(r.phase)}
              </div>
              <div
                className={`mt-0.5 text-xs font-semibold tabular-nums ${
                  complete ? "text-primary" : started ? "" : "text-muted-foreground"
                }`}
              >
                {r.rate}%
                <span className="ml-1 font-normal text-muted-foreground">
                  {r.done}/{r.total}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

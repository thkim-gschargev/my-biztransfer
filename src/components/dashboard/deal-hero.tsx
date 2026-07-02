"use client";

import type { TaskPhase } from "@/types/task";
import type { Project } from "@/types/project";
import type {
  OverallProgress,
  PhaseRow,
  SchedulePace,
} from "@/lib/dashboard-metrics";
import {
  PHASE_LABELS,
  PHASE_CLASSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CLASSES,
} from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProgressRing } from "./progress-ring";
import { PhaseRail } from "./phase-rail";

function ddayText(d: number | null): string {
  if (d == null) return "-";
  if (d === 0) return "D-DAY";
  return d > 0 ? `D-${d}` : `D+${Math.abs(d)}`;
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function PaceBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone} transition-[width] duration-700`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function DealHero({
  project,
  overall,
  phaseRows,
  currentPhase,
  pace,
}: {
  project: Project | undefined;
  overall: OverallProgress;
  phaseRows: PhaseRow[];
  currentPhase: TaskPhase | null;
  pace: SchedulePace;
}) {
  const overdue = pace.daysToTarget != null && pace.daysToTarget < 0;
  const delta = pace.deltaPP;
  // 일정과 진행률이 ±5%p 이내면 "정상" — 소폭 차이로 과잉 경보하지 않는다.
  const badlyBehind = delta != null && delta <= -15;
  const behind = delta != null && delta < -5 && !badlyBehind;
  const onTrack = delta != null && !behind && !badlyBehind;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          {/* 진행률 링 + 딜 요약 */}
          <div className="flex items-center gap-5">
            <ProgressRing
              value={overall.rate}
              sub={`완료 ${overall.done} / ${overall.total}`}
            />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Fact label="상태">
                {project ? (
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${PROJECT_STATUS_CLASSES[project.status]}`}
                  >
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                ) : (
                  "-"
                )}
              </Fact>
              <Fact label="현재 단계">
                {currentPhase ? (
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${PHASE_CLASSES[currentPhase]}`}
                  >
                    {PHASE_LABELS[currentPhase]}
                  </span>
                ) : overall.rate === 100 ? (
                  <span className="inline-flex rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    전체 완료
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </Fact>
              <Fact label="목표일">
                {project?.targetDate ? (
                  formatDate(project.targetDate)
                ) : (
                  <span className="text-muted-foreground">미정</span>
                )}
              </Fact>
              <Fact label="남은 기간">
                {pace.daysToTarget != null ? (
                  <span
                    className={`font-semibold tabular-nums ${overdue ? "text-red-600 dark:text-red-400" : ""}`}
                  >
                    {ddayText(pace.daysToTarget)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </Fact>
            </div>
          </div>

          {/* 일정 대비 진척 */}
          <div className="lg:ml-auto lg:w-72 lg:shrink-0">
            {pace.elapsedRate != null ? (
              <div className="flex flex-col gap-2.5 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">일정 대비 진척</span>
                  {delta != null && (
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        badlyBehind
                          ? "text-red-600 dark:text-red-400"
                          : behind
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {onTrack
                        ? delta >= 0
                          ? `일정 대비 정상 (+${delta}%p)`
                          : "일정 대비 정상"
                        : `일정보다 ${Math.abs(delta)}%p 뒤처짐`}
                    </span>
                  )}
                </div>
                <PaceBar
                  label="일정 소진"
                  value={pace.elapsedRate}
                  tone="bg-slate-400 dark:bg-slate-500"
                />
                <PaceBar
                  label="완료 진행"
                  value={pace.progressRate}
                  tone={
                    badlyBehind
                      ? "bg-red-500"
                      : behind
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                시작일·목표일을 입력하면 일정 대비 진척을 표시합니다.
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* 5단계 진행 레일 */}
        <PhaseRail rows={phaseRows} current={currentPhase} />
      </CardContent>
    </Card>
  );
}

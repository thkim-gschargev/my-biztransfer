"use client";

interface ProgressRingProps {
  /** 0~100 */
  value: number;
  size?: number;
  stroke?: number;
  /** 링 아래 중앙 보조 텍스트 (예: "완료 8 / 19") */
  sub?: string;
  /** 진행 링 색 톤 */
  tone?: "primary" | "emerald" | "amber";
}

const TONE: Record<NonNullable<ProgressRingProps["tone"]>, string> = {
  primary: "stroke-primary",
  emerald: "stroke-emerald-500",
  amber: "stroke-amber-500",
};

/** 순수 inline-SVG 도넛 진행률 링 (차트 라이브러리 불필요). */
export function ProgressRing({
  value,
  size = 128,
  stroke = 12,
  sub,
  tone = "primary",
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        {dash > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            className={`${TONE[tone]} transition-[stroke-dasharray] duration-700 ease-out`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold leading-none tabular-nums tracking-tight">
          {pct}
          <span className="text-lg font-semibold">%</span>
        </span>
        {sub && (
          <span className="mt-1 text-xs text-muted-foreground">{sub}</span>
        )}
      </div>
    </div>
  );
}

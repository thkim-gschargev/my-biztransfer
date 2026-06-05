import type { Task } from "@/types/task";

// ─── Types & constants ───────────────────────────────────────────────────────

export type DateField = "dueDate" | "startDate" | "followUpDate";
export type ViewMode = "month" | "week" | "day";

export const DATE_FIELD_LABELS: Record<DateField, string> = {
  dueDate: "마감일",
  startDate: "시작일",
  followUpDate: "팔로업일",
};

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  month: "월",
  week: "주",
  day: "일",
};

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
export const MAX_VISIBLE_TASKS = 3;

// ─── Date utilities ──────────────────────────────────────────────────────────

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(d.getDate() + n);
  return x;
}

export interface CalendarCell {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export function buildMonthCells(year: number, month: number): CalendarCell[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    cells.push({
      date: d,
      dateStr: toYMD(d),
      isCurrentMonth: d.getMonth() === month,
      isToday: isSameDay(d, today),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return cells;
}

export function buildWeekCells(date: Date): CalendarCell[] {
  const today = new Date();
  const startOffset = date.getDay();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(date, -startOffset + i);
    cells.push({
      date: d,
      dateStr: toYMD(d),
      isCurrentMonth: true,
      isToday: isSameDay(d, today),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return cells;
}

// ─── Per-cell content (lane-aware range bars + single-date chips) ───────────

export interface CellGridData {
  singleByDate: Map<string, Task[]>;
  visibleRangeTasks: Task[];
  laneMap: Map<string, number>;
  maxLane: number;
}

export function buildCellGridData(
  cells: CalendarCell[],
  tasks: Task[],
  dateField: DateField,
  showRangeBars: boolean,
): CellGridData {
  const singleByDate = new Map<string, Task[]>();
  const rangeCandidates: Task[] = [];

  for (const t of tasks) {
    const hasRange =
      !!t.startDate &&
      !!t.dueDate &&
      t.startDate.substring(0, 10) !== t.dueDate.substring(0, 10);
    if (showRangeBars && hasRange) {
      rangeCandidates.push(t);
    } else {
      const raw = t[dateField];
      if (!raw) continue;
      const key = raw.substring(0, 10);
      if (!singleByDate.has(key)) singleByDate.set(key, []);
      singleByDate.get(key)!.push(t);
    }
  }

  const visibleRangeTasks: Task[] = [];
  if (cells.length > 0) {
    const minDate = cells[0].dateStr;
    const maxDate = cells[cells.length - 1].dateStr;
    for (const t of rangeCandidates) {
      const s = t.startDate!.substring(0, 10);
      const e = t.dueDate!.substring(0, 10);
      if (s <= maxDate && e >= minDate) visibleRangeTasks.push(t);
    }
  }
  visibleRangeTasks.sort((a, b) =>
    (a.startDate ?? "").localeCompare(b.startDate ?? ""),
  );

  // Lane assignment (greedy)
  const laneEnds: string[] = [];
  const laneMap = new Map<string, number>();
  for (const t of visibleRangeTasks) {
    const s = t.startDate!.substring(0, 10);
    const e = t.dueDate!.substring(0, 10);
    let lane = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] < s) {
        lane = i;
        laneEnds[i] = e;
        break;
      }
    }
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e);
    }
    laneMap.set(t.id, lane);
  }

  return {
    singleByDate,
    visibleRangeTasks,
    laneMap,
    maxLane: laneEnds.length - 1,
  };
}

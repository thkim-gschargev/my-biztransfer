const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=일, 1=월
  const diff = (day === 0 ? -6 : 1 - day); // 월요일 기준
  const monday = new Date(startOfDay(d));
  monday.setDate(monday.getDate() + diff);
  return monday;
}

function parseDate(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value;
}

// ─── 판별 ────────────────────────────────────────────────────────────────────

export function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const target = startOfDay(parseDate(dateStr));
  const today = startOfDay(new Date());
  return target.getTime() === today.getTime();
}

export function isThisWeek(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const target = startOfDay(parseDate(dateStr));
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
  return target >= weekStart && target < weekEnd;
}

export function isPastDue(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const target = startOfDay(parseDate(dateStr));
  const today = startOfDay(new Date());
  return target < today;
}

// ─── 계산 ────────────────────────────────────────────────────────────────────

/** 두 날짜 사이의 일수 차이 (양수 = to가 미래) */
export function daysDiff(from: string | Date, to: string | Date): number {
  const a = startOfDay(parseDate(from)).getTime();
  const b = startOfDay(parseDate(to)).getTime();
  return Math.round((b - a) / DAY_MS);
}

/** requestedAt 기준 경과 일수 (회신 대기 일수) */
export function waitingDays(requestedAt: string | undefined): number {
  if (!requestedAt) return 0;
  return Math.max(0, daysDiff(requestedAt, new Date()));
}

// ─── 포맷 ────────────────────────────────────────────────────────────────────

/** yyyy-MM-dd */
export function formatDate(value: string | Date | undefined): string {
  if (!value) return "";
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 화면 표시용: 오늘 → "오늘", 내일 → "내일", 그 외 → "M월 D일" */
export function formatDisplayDate(value: string | Date | undefined): string {
  if (!value) return "-";
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return "-";
  const diff = daysDiff(new Date(), d);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff === -1) return "어제";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

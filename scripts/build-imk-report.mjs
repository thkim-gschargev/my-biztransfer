/**
 * IMK 양수도 관제판 → 자체완결 단일 HTML 보고서 생성기.
 *
 * - 실행 시점에 Supabase(service_role, 로컬 .env.local)에서 IMK 딜 데이터를 조회하고,
 *   관제판을 인라인 CSS로 렌더한 정적 HTML 한 장을 report/ 에 출력한다.
 * - 출력 HTML에는 키·백엔드 연결이 전혀 없다(데이터가 이미 그려진 정적 파일).
 * - 단계/업무 펼치기는 순수 HTML <details> 로 구현(JS 불필요, 인쇄도 잘 됨).
 *
 * 사용:  node scripts/build-imk-report.mjs
 * 결과:  report/관제판-imk.html  → R2에 덮어쓰기 업로드
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { uploadToR2 } from "./lib/r2-upload.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMK_NAME = "IMK(아이마켓코리아) 양수도";
const OUT = join(ROOT, "report", "관제판-imk.html");
const DO_UPLOAD = process.argv.includes("--upload");

// ─── 라벨 (constants.ts 미러) ─────────────────────────────────────────────────
const PHASE_LABELS = {
  1: "1단계 · 사전 준비",
  2: "2단계 · 계약/연동 준비",
  3: "3단계 · 연동개발/전환일정",
  4: "4단계 · 검증/테스트",
  5: "5단계 · 전환 실행",
};
const STATUS_LABELS = {
  new: "신규", in_progress: "진행 중", waiting: "회신 대기", review: "검토 필요",
  hold: "보류", delayed: "지연", monitoring: "모니터링", done: "완료", cancelled: "취소",
};
const STATUS_COLOR = {
  new: "#64748b", in_progress: "#2563eb", waiting: "#d97706", review: "#7c3aed",
  hold: "#6b7280", delayed: "#dc2626", monitoring: "#0d9488", done: "#16a34a", cancelled: "#9ca3af",
};
const PRIORITY_LABELS = { urgent: "긴급", high: "높음", normal: "보통", low: "낮음" };
const CATEGORY_LABELS = {
  tech_support: "충전기술지원팀", tech_planning: "충전기술기획팀", platform: "플랫폼개발팀",
  planning: "기획관리팀", biz_planning: "경영기획부문", deal: "Deal팀", legal: "법무팀",
  asset: "구매자산관리팀", construction: "구축관리팀", network_sales: "네트워크영업팀",
  network_maint: "네트워크유지보수팀", cx: "고객경험팀", marketing: "마케팅팀",
  safety: "안전관리팀", etc: "기타",
};
const PROJECT_STATUS_LABELS = {
  planned: "예정", in_progress: "진행 중", hold: "보류", done: "완료", cancelled: "취소",
};

// ─── 날짜 유틸 (date.ts 미러) ─────────────────────────────────────────────────
const DAY = 24 * 60 * 60 * 1000;
const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// 날짜 전용 문자열("YYYY-MM-DD")은 로컬 자정으로 파싱 — new Date(iso)의 UTC 자정 파싱은
// UTC 이서 타임존에서 하루 밀리는 결함이 있다. 타임스탬프 문자열은 그대로 파싱.
const parse = (v) => {
  if (v instanceof Date) return v;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
};
const daysDiff = (from, to) => Math.round((sod(parse(to)) - sod(parse(from))) / DAY);
const isPastDue = (s) => (s ? sod(parse(s)) < sod(new Date()) : false);
const dateOnly = (s) => (s ? String(s).slice(0, 10) : "");

// ─── 지표 계산 (dashboard-metrics.ts 미러) ────────────────────────────────────
function classify(t) {
  if (t.status === "done") return "done";
  if (t.status === "delayed" || isPastDue(t.dueDate)) return "delayed";
  if (t.status === "in_progress") return "inProgress";
  return "pending";
}
function overallOf(tasks) {
  const c = { done: 0, delayed: 0, inProgress: 0, pending: 0 };
  for (const t of tasks) c[classify(t)]++;
  const waiting = tasks.filter((t) => t.status === "waiting" && classify(t) === "pending").length;
  const review = tasks.filter((t) => t.status === "review" && classify(t) === "pending").length;
  return {
    total: tasks.length, ...c, waiting, review,
    rate: tasks.length ? Math.round((c.done / tasks.length) * 100) : 0,
  };
}
function phaseRowsOf(tasks) {
  const rows = [];
  for (const phase of [1, 2, 3, 4, 5, 0]) {
    const inPhase = tasks.filter((t) => (t.phase ?? 0) === phase);
    if (phase === 0 && inPhase.length === 0) continue;
    const c = { done: 0, delayed: 0, inProgress: 0, pending: 0 };
    for (const t of inPhase) c[classify(t)]++;
    rows.push({
      phase, total: inPhase.length, ...c,
      rate: inPhase.length ? Math.round((c.done / inPhase.length) * 100) : 0,
      tasks: inPhase.slice().sort(sortTasks),
    });
  }
  return rows;
}
const STATUS_ORDER = { delayed: 0, in_progress: 1, review: 2, waiting: 3, monitoring: 4, hold: 5, new: 6, done: 7, cancelled: 8 };
function sortTasks(a, b) {
  return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
    || a.title.localeCompare(b.title);
}
function phaseStatus(tasks) {
  if (!tasks.length) return null;
  if (tasks.every((t) => t.status === "done")) return { label: "완료", color: "#16a34a" };
  if (tasks.every((t) => t.status === "new")) return { label: "시작전", color: "#64748b" };
  return { label: "진행중", color: "#2563eb" };
}
function schedulePace(project, rate) {
  const { startDate: start, targetDate: target } = project;
  const today = new Date();
  const daysToTarget = target ? daysDiff(today, target) : null;
  let elapsed = null;
  if (start && target) {
    const span = daysDiff(start, target);
    if (span > 0) elapsed = Math.min(100, Math.max(0, Math.round((daysDiff(start, today) / span) * 100)));
  }
  return { daysToTarget, elapsed, rate, delta: elapsed == null ? null : rate - elapsed };
}
function riskItems(tasks) {
  const items = [];
  for (const t of tasks) {
    if (t.status === "done") continue;
    if (t.status === "delayed" || isPastDue(t.dueDate)) {
      const over = t.dueDate ? daysDiff(t.dueDate, new Date()) : 0;
      items.push({ t, sev: "high", reason: over > 0 ? `마감 ${over}일 초과` : "지연" });
    } else if (t.status === "review") items.push({ t, sev: "mid", reason: "검토 필요" });
    else if (t.status === "waiting") items.push({ t, sev: "mid", reason: "회신 대기" });
    else if (t.status === "hold") items.push({ t, sev: "mid", reason: "보류" });
  }
  const rank = { high: 0, mid: 1 };
  return items.sort((a, b) => rank[a.sev] - rank[b.sev] || (a.t.dueDate ?? "9999").localeCompare(b.t.dueDate ?? "9999"));
}
function upcoming(tasks, limit = 8) {
  const today = new Date();
  return tasks
    .filter((t) => t.status !== "done" && t.dueDate && daysDiff(today, t.dueDate) >= 0)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, limit);
}

// ─── HTML 헬퍼 ────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catLabel = (c) => CATEGORY_LABELS[c] ?? c;
const dday = (d) => (d == null ? "-" : d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : `D+${Math.abs(d)}`);

function ring(rate) {
  const size = 132, stroke = 13, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const dash = (rate / 100) * c;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="ring">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"/>
    ${dash > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#2563eb" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${dash} ${c - dash}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` : ""}
    <text x="50%" y="48%" text-anchor="middle" class="ring-num">${rate}%</text>
  </svg>`;
}
function compBar(row) {
  if (!row.total) return `<div class="cbar"></div>`;
  const seg = (n, color) => (n ? `<i style="width:${(n / row.total) * 100}%;background:${color}"></i>` : "");
  return `<div class="cbar">${seg(row.done, "#16a34a")}${seg(row.inProgress, "#2563eb")}${seg(row.pending, "#cbd5e1")}${seg(row.delayed, "#dc2626")}</div>`;
}
function taskDetail(t) {
  const rows = [
    ["상태", `<span class="dot" style="background:${STATUS_COLOR[t.status]}"></span>${esc(STATUS_LABELS[t.status] ?? t.status)}`],
    ["우선순위", esc(PRIORITY_LABELS[t.priority] ?? t.priority)],
    ["담당팀", esc(catLabel(t.category))],
    t.assigneeOrPartner ? ["협력사", esc(t.assigneeOrPartner)] : null,
    t.chargerModel ? ["모델", esc(t.chargerModel)] : null,
    t.startDate ? ["시작일", esc(dateOnly(t.startDate))] : null,
    t.dueDate ? ["마감일", esc(dateOnly(t.dueDate))] : null,
    t.description ? ["상세", esc(t.description)] : null,
    t.nextAction ? ["다음 액션", esc(t.nextAction)] : null,
    t.memo ? ["비고", esc(t.memo)] : null,
  ].filter(Boolean);
  return `<div class="tdetail">${rows.map(([k, v]) => `<div class="trow"><span class="tk">${k}</span><span class="tv">${v}</span></div>`).join("")}</div>`;
}
function taskItem(t) {
  const due = t.dueDate ? `<span class="tdue">${esc(dateOnly(t.dueDate).slice(5))}</span>` : "";
  return `<details class="task">
    <summary>
      <span class="dot" style="background:${STATUS_COLOR[t.status]}"></span>
      <span class="ttitle">${esc(t.title)}</span>
      ${t.assigneeOrPartner ? `<span class="tpartner">${esc(t.assigneeOrPartner)}</span>` : ""}
      ${due}
      <span class="tbadge" style="color:${STATUS_COLOR[t.status]};background:${STATUS_COLOR[t.status]}1a">${esc(STATUS_LABELS[t.status] ?? t.status)}</span>
    </summary>
    ${taskDetail(t)}
  </details>`;
}

function render({ project, tasks, generatedAt }) {
  const overall = overallOf(tasks);
  const rows = phaseRowsOf(tasks);
  const pace = schedulePace(project, overall.rate);
  const risks = riskItems(tasks);
  const ups = upcoming(tasks);
  const overdue = pace.daysToTarget != null && pace.daysToTarget < 0;
  const behind = pace.delta != null && pace.delta < -5;

  const kpis = [
    ["완료", overall.done, "#16a34a"], ["진행 중", overall.inProgress, "#2563eb"],
    ["지연", overall.delayed, "#dc2626"], ["회신 대기", overall.waiting, "#d97706"],
    ["검토 필요", overall.review, "#7c3aed"],
  ];

  const rail = [1, 2, 3, 4, 5].map((p) => {
    const row = rows.find((r) => r.phase === p) ?? { rate: 0, done: 0, total: 0 };
    const complete = row.total > 0 && row.done === row.total;
    const name = (PHASE_LABELS[p].split("·")[1] ?? "").trim();
    return `<div class="step">
      <div class="stepbar"><i style="width:${row.rate}%"></i></div>
      <div class="circle ${complete ? "done" : row.done > 0 ? "ip" : ""}">${complete ? "✓" : p}</div>
      <div class="steplabel">${p}단계<br><span>${esc(name)}</span></div>
      <div class="steprate">${row.rate}% <em>${row.done}/${row.total}</em></div>
    </div>`;
  }).join("");

  const phaseBlocks = rows.map((r) => {
    const ps = phaseStatus(r.tasks);
    const title = r.phase === 0 ? "단계 미지정" : PHASE_LABELS[r.phase];
    return `<details class="phase">
      <summary>
        <span class="pname">
          <span class="chev">›</span>${esc(title)}
          ${ps ? `<span class="pstatus" style="color:${ps.color};background:${ps.color}1a">${ps.label}</span>` : ""}
        </span>
        <span class="pnum">${r.total}</span>
        <span class="pnum done">${r.done}</span>
        <span class="pnum">${r.inProgress || "-"}</span>
        <span class="pnum ${r.delayed ? "bad" : ""}">${r.delayed || "-"}</span>
        <span class="pbar">${compBar(r)}<em>${r.rate}%</em></span>
      </summary>
      <div class="tasks">${r.tasks.map(taskItem).join("") || '<p class="muted pad">업무 없음</p>'}</div>
    </details>`;
  }).join("");

  const riskHtml = risks.length
    ? risks.slice(0, 10).map(({ t, sev, reason }) => `<li>
        <span class="dot" style="background:${sev === "high" ? "#dc2626" : "#d97706"}"></span>
        <span class="rti"><b>${esc(t.title)}</b><small>${t.phase ? `${t.phase}단계 · ` : ""}${esc(catLabel(t.category))}${t.assigneeOrPartner ? ` · ${esc(t.assigneeOrPartner)}` : ""}</small></span>
        <span class="rbadge" style="color:${sev === "high" ? "#dc2626" : "#d97706"};background:${sev === "high" ? "#dc26261a" : "#d977061a"}">${esc(reason)}</span>
      </li>`).join("")
    : '<li class="ok">✓ 현재 주의가 필요한 항목이 없습니다.</li>';

  const upHtml = ups.length
    ? ups.map((t) => {
        const d = daysDiff(new Date(), t.dueDate);
        return `<li>
          <span class="uday${d <= 7 ? " soon" : ""}">${dday(d)}<small>${esc(dateOnly(t.dueDate).slice(5))}</small></span>
          <span class="uti"><b>${esc(t.title)}</b><small>${t.phase ? `${t.phase}단계 · ` : ""}${esc(catLabel(t.category))}${t.assigneeOrPartner ? ` · ${esc(t.assigneeOrPartner)}` : ""}</small></span>
        </li>`;
      }).join("")
    : '<li class="muted pad">예정된 마감 일정이 없습니다.</li>';

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(project.name)} · 진행 현황 보고</title>
<style>
  :root{--bd:#e2e8f0;--mut:#64748b;--ink:#0f172a}
  *{box-sizing:border-box}
  body{margin:0;background:#f1f5f9;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Segoe UI",Roboto,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
  .report{max-width:1080px;margin:0 auto;padding:28px 20px 48px}
  .card{background:#fff;border:1px solid var(--bd);border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
  .muted{color:var(--mut)} .pad{padding:14px}
  .dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto;display:inline-block}
  /* header */
  header.hd{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 14px;margin-bottom:18px}
  header.hd h1{font-size:22px;margin:0;letter-spacing:-.02em}
  .pill{font-size:12px;font-weight:600;padding:2px 9px;border-radius:7px;border:1px solid var(--bd)}
  .meta{color:var(--mut);font-size:13px;margin-left:auto}
  /* hero */
  .hero{display:flex;flex-wrap:wrap;gap:22px;align-items:center;padding:20px 22px;margin-bottom:14px}
  .ring{flex:0 0 auto}.ring-num{font-size:30px;font-weight:700;fill:var(--ink)}
  .facts{display:grid;grid-template-columns:repeat(2,auto);gap:10px 26px}
  .facts .k{font-size:12px;color:var(--mut)} .facts .v{font-size:14px;font-weight:600}
  .pace{margin-left:auto;min-width:230px;border:1px solid var(--bd);border-radius:10px;padding:12px;background:#f8fafc}
  .pace .top{display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:8px}
  .pline{margin:6px 0}.pline .lab{display:flex;justify-content:space-between;font-size:11px;color:var(--mut)}
  .pbart{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden;margin-top:3px}.pbart>i{display:block;height:100%}
  /* rail */
  .rail{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:16px 22px 20px;border-top:1px solid var(--bd)}
  .step{text-align:center;padding:0 4px}
  .stepbar{height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-bottom:10px}.stepbar>i{display:block;height:100%;background:#16a34a}
  .circle{width:30px;height:30px;line-height:28px;margin:0 auto;border-radius:50%;border:2px solid var(--bd);color:var(--mut);font-weight:700;font-size:13px;background:#fff}
  .circle.done{background:#16a34a;border-color:#16a34a;color:#fff}
  .circle.ip{border-color:#2563eb;color:#2563eb}
  .steplabel{font-size:12px;font-weight:600;margin-top:7px}.steplabel span{font-weight:400;color:var(--mut);font-size:11px}
  .steprate{font-size:12px;font-weight:700;margin-top:3px}.steprate em{font-style:normal;font-weight:400;color:var(--mut)}
  /* kpi */
  .kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:14px 0}
  .kpi .k{padding:14px 16px;border-radius:12px;background:#fff;border:1px solid var(--bd)}
  .kpi .n{font-size:24px;font-weight:700;letter-spacing:-.02em}.kpi .l{font-size:12px;color:var(--mut);margin-top:2px}
  /* section title */
  h2.sec{font-size:15px;margin:22px 0 10px}
  /* phase table */
  .ptable{overflow:hidden}
  .phead,.phase>summary{display:grid;grid-template-columns:minmax(0,1fr) 56px 56px 56px 56px minmax(160px,34%);align-items:center;gap:8px;padding:11px 16px}
  .phead{font-size:12px;color:var(--mut);border-bottom:1px solid var(--bd);background:#f8fafc}
  .phead span:not(:first-child){text-align:center}.phead span:last-child{text-align:left}
  .phase{border-bottom:1px solid var(--bd)}.phase:last-child{border-bottom:0}
  .phase>summary{cursor:pointer;list-style:none;font-size:14px}
  .phase>summary::-webkit-details-marker{display:none}
  .pname{display:flex;align-items:center;gap:6px;font-weight:600;min-width:0}
  .chev{color:var(--mut);transition:transform .15s;display:inline-block}.phase[open]>summary .chev{transform:rotate(90deg)}
  .pstatus{font-size:10px;font-weight:700;padding:1px 6px;border-radius:5px}
  .pnum{text-align:center;font-variant-numeric:tabular-nums;color:var(--mut)}.pnum.done{color:#16a34a;font-weight:600}.pnum.bad{color:#dc2626;font-weight:700}
  .pbar{display:flex;align-items:center;gap:8px}.pbar em{font-style:normal;font-weight:700;font-size:12px;width:34px;text-align:right}
  .cbar{display:flex;height:8px;width:100%;background:#eef2f6;border-radius:99px;overflow:hidden}.cbar>i{display:block;height:100%}
  .tasks{background:#f8fafc;border-top:1px solid var(--bd)}
  /* task */
  .task{border-bottom:1px solid #eef2f6}.task:last-child{border-bottom:0}
  .task>summary{display:flex;align-items:center;gap:9px;padding:9px 16px 9px 34px;cursor:pointer;list-style:none;font-size:13px}
  .task>summary::-webkit-details-marker{display:none}
  .task>summary::before{content:"›";position:absolute;margin-left:-18px;color:#94a3b8;transition:transform .15s}
  .task[open]>summary::before{transform:rotate(90deg)}
  .ttitle{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tpartner{color:var(--mut);font-size:12px;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tdue{color:var(--mut);font-size:12px;font-variant-numeric:tabular-nums}
  .tbadge{font-size:11px;font-weight:600;padding:1px 7px;border-radius:6px;white-space:nowrap}
  .tdetail{padding:4px 16px 14px 34px;display:grid;gap:5px}
  .trow{display:grid;grid-template-columns:74px 1fr;gap:10px;font-size:13px;align-items:start}
  .trow .tk{color:var(--mut)} .trow .tv{white-space:pre-wrap;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  /* two col */
  .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .listcard h3{font-size:14px;margin:0;padding:12px 16px;border-bottom:1px solid var(--bd)}
  .listcard ul{list-style:none;margin:0;padding:0}
  .listcard li{display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid #eef2f6;font-size:13px}
  .listcard li:last-child{border-bottom:0}
  .rti,.uti{flex:1;min-width:0;display:flex;flex-direction:column}
  .rti b,.uti b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rti small,.uti small{color:var(--mut);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rbadge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap}
  .uday{flex:0 0 auto;width:58px;text-align:center;font-weight:700;font-size:13px}.uday.soon{color:#7c3aed}.uday small{display:block;font-weight:400;color:var(--mut);font-size:10px}
  li.ok{color:#16a34a;justify-content:center;padding:22px}
  footer{margin-top:22px;color:var(--mut);font-size:12px;text-align:center;border-top:1px solid var(--bd);padding-top:14px}
  @media(max-width:820px){.kpi,.rail{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}.pace{margin-left:0;width:100%}.phead{display:none}.phase>summary{grid-template-columns:1fr auto}.phase>summary .pnum{display:none}}
  @media print{body{background:#fff}.card{box-shadow:none}details>*{display:revert !important}.chev,.task>summary::before{display:none}}
</style>
</head>
<body>
<main class="report">
  <header class="hd">
    <h1>${esc(project.name)}</h1>
    <span class="pill" style="color:#2563eb;background:#eff6ff">${esc(PROJECT_STATUS_LABELS[project.status] ?? project.status)}</span>
    <span class="meta">보고 기준 ${esc(generatedAt)}${project.targetDate ? ` · 목표일 ${esc(dateOnly(project.targetDate))} (${dday(pace.daysToTarget)})` : ""}</span>
  </header>

  <section class="card">
    <div class="hero">
      ${ring(overall.rate)}
      <div class="facts">
        <div><div class="k">전체 진행률</div><div class="v">${overall.rate}% <span class="muted" style="font-weight:400">완료 ${overall.done}/${overall.total}</span></div></div>
        <div><div class="k">목표일</div><div class="v">${project.targetDate ? esc(dateOnly(project.targetDate)) : "미정"}</div></div>
        <div><div class="k">남은 기간</div><div class="v" style="${overdue ? "color:#dc2626" : ""}">${dday(pace.daysToTarget)}</div></div>
        <div><div class="k">지연 항목</div><div class="v" style="${overall.delayed ? "color:#dc2626" : ""}">${overall.delayed}건</div></div>
      </div>
      <div class="pace">
        <div class="top"><span>일정 대비 진척</span>${pace.delta == null ? "" : `<span style="color:${behind ? "#dc2626" : "#16a34a"}">${pace.delta >= 0 ? `정상 (+${pace.delta}%p)` : behind ? `${Math.abs(pace.delta)}%p 뒤처짐` : "정상"}</span>`}</div>
        ${pace.elapsed == null ? '<div class="muted" style="font-size:12px">시작일·목표일 입력 시 표시</div>' : `
        <div class="pline"><div class="lab"><span>일정 소진</span><span>${pace.elapsed}%</span></div><div class="pbart"><i style="width:${pace.elapsed}%;background:#94a3b8"></i></div></div>
        <div class="pline"><div class="lab"><span>완료 진행</span><span>${pace.rate}%</span></div><div class="pbart"><i style="width:${pace.rate}%;background:${behind ? "#dc2626" : "#16a34a"}"></i></div></div>`}
      </div>
    </div>
    <div class="rail">${rail}</div>
  </section>

  <div class="kpi">
    ${kpis.map(([l, n, c]) => `<div class="k"><div class="n" style="color:${c}">${n}</div><div class="l">${l}</div></div>`).join("")}
  </div>

  <h2 class="sec">단계별 진행 현황 <span class="muted" style="font-weight:400;font-size:12px">· 단계·업무를 눌러 펼치기</span></h2>
  <section class="card ptable">
    <div class="phead"><span>단계</span><span>항목</span><span>완료</span><span>진행</span><span>지연</span><span>진행률</span></div>
    ${phaseBlocks}
  </section>

  <div class="two" style="margin-top:22px">
    <section class="card listcard"><h3>주의 필요 ${risks.length ? `<span class="rbadge" style="color:#dc2626;background:#dc26261a">${risks.length}</span>` : ""}</h3><ul>${riskHtml}</ul></section>
    <section class="card listcard"><h3>다가오는 주요 일정</h3><ul>${upHtml}</ul></section>
  </div>

  <footer>보고 기준 ${esc(generatedAt)} · ${esc(project.name)} · GS차지비 내부용 (대외비)</footer>
</main>
</body>
</html>`;
}

// ─── main ─────────────────────────────────────────────────────────────────────
function loadEnv() {
  const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: projects, error: pErr } = await db.from("projects").select("*").eq("name", IMK_NAME);
  if (pErr) throw pErr;
  if (!projects || projects.length !== 1) throw new Error(`IMK 프로젝트 조회 실패 (${projects?.length ?? 0}개)`);
  const p = projects[0];
  const project = { name: p.name, status: p.status, startDate: dateOnly(p.start_date), targetDate: dateOnly(p.target_date) };

  const { data: taskRows, error: tErr } = await db.from("tasks").select("*").eq("project_id", p.id);
  if (tErr) throw tErr;
  const tasks = (taskRows ?? [])
    .filter((r) => r.status !== "cancelled")
    .map((r) => ({
      id: r.id, title: r.title, status: r.status, priority: r.priority, category: r.category,
      phase: r.phase == null ? undefined : Number(r.phase),
      assigneeOrPartner: r.assignee_or_partner ?? undefined, chargerModel: r.charger_model ?? undefined,
      description: r.description ?? undefined, nextAction: r.next_action ?? undefined, memo: r.memo ?? undefined,
      dueDate: dateOnly(r.due_date) || undefined, startDate: dateOnly(r.start_date) || undefined,
    }));

  const generatedAt = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const html = render({ project, tasks, generatedAt });
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, html, "utf8");

  const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0);
  console.log(`✅ 생성 완료: report/관제판-imk.html  (${tasks.length}개 업무, ${kb} KB)`);
  console.log(`   보고 기준: ${generatedAt}`);

  if (DO_UPLOAD) {
    await uploadToR2(html, env, { key: env.R2_OBJECT_KEY || "관제판-imk.html" });
  } else {
    console.log(`   → R2 업로드까지 하려면: npm run report:imk:deploy`);
  }
}

main().catch((e) => {
  console.error("❌ 실패:", e.message ?? e);
  process.exit(1);
});

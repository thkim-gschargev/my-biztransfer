/**
 * 충전기술지원팀 연동 관련 일정 → 자체완결 단일 HTML 생성기 (R2 배포용).
 *
 * 소스: reference/개인 페이지 & 공유된 페이지 (노션 내보내기, 대외비) 내용을
 *       최신 일정(IMK-EV7 릴리즈 7/3 오전 · 대유 시료 7/9 오후 · TC 회신 이브이시스 7/2 / 시그넷 7/7)
 *       으로 업데이트해 이 파일의 DATA 에 구조화해 두었다. 내용 변경 시 DATA 만 고치면 된다.
 * 출력 HTML에는 키·백엔드 연결이 전혀 없다(완전 정적).
 *
 * 사용:  npm run report:schedule           → report/연동일정-충전기술지원팀.html 생성
 *        npm run report:schedule:deploy    → 생성 + R2 업로드(같은 키 덮어쓰기)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { uploadToR2 } from "./lib/r2-upload.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "report", "연동일정-충전기술지원팀.html");
const DO_UPLOAD = process.argv.includes("--upload");

// ═══════════════════════════════════════════════════════════════════════════
// DATA — 일정이 바뀌면 여기만 수정
// ═══════════════════════════════════════════════════════════════════════════
const DATA = {
  title: "충전기술지원팀 연동 관련 일정",
  subtitle: "IMK(아이마켓코리아) 양수도 · 연동 개발/전환",

  // 7월 주요 일정 (D-day 자동 계산)
  keyDates: [
    { date: "2026-07-02", label: "이브이시스 프록시 TestCase 문서 회신", tag: "Proxy" },
    { date: "2026-07-03", label: "IMK-EV7 수정 펌웨어 릴리즈 (오전)", tag: "펌웨어" },
    { date: "2026-07-07", label: "시그넷 프록시 TestCase 문서 회신", tag: "Proxy" },
    { date: "2026-07-07", label: "모니트 프록시 테스트 결과 회신", tag: "Proxy" },
    { date: "2026-07-09", label: "대유플러스 시료 전달 (오후)", tag: "검증" },
    { date: "2026-07-10", label: "GS차지비 Proxy 검증 완료 목표 (삼성전자DS 평택 16기 선전환)", tag: "검증" },
    { date: "2026-07-10", label: "EVSIS UI 시나리오 전달 — 12.1인치 급속", tag: "EVSIS" },
    { date: "2026-07-17", label: "IMK-EV7·대유플러스 GS-OCPP 검증 완료 목표", tag: "검증" },
    { date: "2026-07-31", label: "EVSIS UI 시나리오 전달 — 24인치 급속/초급속", tag: "EVSIS" },
  ],

  transition: {
    note: "기존 5/31 전환 완료 예정이었으나, 계약서 검토 및 전환 동의 확보 일정으로 변경.",
    items: [
      { when: "7월", what: "일부 상면 우선 전환" },
      { when: "8월 이후", what: "그 외 상면 순차 전환 예정" },
    ],
  },

  proxy: {
    step1: {
      title: "단계 1 · 아이마켓코리아 연동 Proxy 개발 및 전환",
      status: "전환 진행 중",
      statusTone: "blue",
      items: [
        { done: true, text: "6/5 아이마켓코리아–모니트 간 Proxy 연동 개발 완료" },
        { done: true, text: "6/9 현장 연동 테스트 진행" },
        { done: true, text: "6/10부터 아이마켓 운영 충전기 Proxy 서버 연결 전환 시작" },
        { done: false, text: "6/30까지 전환 완료 예정 → 일부 지방 충전소 방문 일정이 남아 7월 중 전체 전환 완료 예정" },
      ],
    },
    step2: {
      title: "단계 2 · GS차지비 연동 Proxy 개발 및 전환",
      status: "테스트/검증 중 · 일정 지연",
      statusTone: "amber",
      items: [
        { done: true, text: "6/10부터 GS차지비 Proxy 연동 개발 시작, 6/16부터 테스트 진행" },
        { done: false, text: "모니트 측 테스트 진행 중 — 개발 지연으로 7/7(화)까지 프록시 테스트 결과 회신 예정", was: "6/29까지 완료·회신 예정" },
        { done: false, text: "프록시 TestCase 문서 회신 — 이브이시스 7/2(목) · 시그넷 7/7(화)" },
        { done: false, text: "GS차지비 검증(6/30~): 삼성전자DS 평택 2단지 주차동 16기(미운영 예정) 테스트 후 선전환 — 모니트 개발 지연으로 ~7/10", was: "~7/1" },
      ],
    },
  },

  ocppDirect: {
    title: "직접 연동 모델 (Proxy 미적용)",
    head: ["제조사/모델", "수량(기)", "진행 현황", "검증 일정(목표)", "비고"],
    rows: [
      ["JS테크 완속 IMK-EV7", "713", "6/24 시료 전달 완료", "6/25 ~ 7/17",
        "시료 수령 지연(6/12→6/19→6/24, 모니트 측 사유) · 펌웨어 수정 필요 — 수정 펌웨어 7/3(금) 오전 릴리즈"],
      ["대유플러스 완속 DY1007-11R", "483", "7/9(목) 오후 시료 전달 예정", "~ 7/17",
        "시료 수령 지연(6/19→6/30→7/9, 모니트 측 사유) · Proxy 테스트 우선이라 추가 지연 가능"],
    ],
  },
  ocppProxyFirst: {
    title: "Proxy 선적용 후 연동 모델",
    head: ["제조사/모델", "수량(기)", "진행 현황", "비고"],
    rows: [
      ["시그넷 완속 HB14K-EV-C1C1-G1", "142", "~ 12월 개발 및 현장 적용 예정", "프록시 TestCase 문서 회신 7/7(화) 예정"],
      ["EVSIS 완/급속 9모델", "498", "~ 12월 개발 및 현장 적용 예정",
        "프록시 TestCase 문서 회신 7/2(목) · 기존 운영 중 필드이슈 동일 모델(487기)에도 해당 펌웨어 적용 가능"],
    ],
  },

  evsisUi: {
    title: "UX/UI 시나리오 제공 현황",
    head: ["전달 일정", "화면 크기", "해상도", "비고"],
    rows: [
      ["6/12 → 6/15 (완료)", "4.3인치", "800×480", "GS차지비 측 작업 지연으로 일정 변경 · 신용카드 추가 시나리오 전달"],
      ["6/26 → 6/30", "8인치", "1280×720", "UI 수정 발견으로 일정 변경 — 충전속도 kWh→kW 표기, 일부 좌우반전 UI 수정"],
      ["7/10", "12.1인치", "800×600", ""],
      ["7/31", "24인치", "1080×1920", ""],
    ],
  },
  evsisFw: {
    title: "펌웨어 개발 일정 및 현황 (9모델 · 498기)",
    head: ["No", "모델명", "타입", "속도(kW)", "UI 사이즈/해상도", "카드리더기", "GS차지비 운영", "UI 전달 일정", "개발 진행"],
    rows: [
      ["1", "JC-92B1-7-01B", "완속", "7", "4.3″ / 800×480", "TL-3700", "신규", "6/15 (완료)", "진행 중 (개발 예정일 이브이시스 확인 중)"],
      ["2", "JC-92B1-7-F1B7", "완속", "7", "4.3″ / 800×480", "TL-3700", "신규", "6/15 (완료)", "진행 중"],
      ["3", "JC-9111KE-TP-BC", "완속", "7", "8″ / 1280×720", "TL-3500BP", "O", "6/30 (예정)", "-"],
      ["4", "JC-91B2-14-0A1", "완속", "14", "8″ / 1280×720", "TL-3500BP", "O", "6/30 (예정)", "-"],
      ["5", "JC-9931-50-3", "급속", "50", "12.1″ / 800×600", "TL-3600", "O", "7/10 (예정)", "-"],
      ["6", "JC-9932-100-821", "급속", "100", "12.1″ / 800×600", "TL-3600", "O", "7/10 (예정)", "-"],
      ["7", "JC-9932-100-8216", "급속", "100", "12.1″ / 800×600", "TL-3600", "신규", "7/10 (예정)", "-"],
      ["8", "JC-9932-100-CU", "급속", "100", "24″ / 1080×1920", "TL-3600", "O", "7/31 (예정)", "-"],
      ["9", "JC-96S1-200-0W", "초급속", "200", "24″ / 1080×1920", "TL-3600", "신규", "7/31 (예정)", "-"],
    ],
  },

  proxyKeep: {
    note: "펌웨어 수정이 불가하여 Proxy를 계속 사용해야 하는 대상",
    head: ["제조사/모델", "수량(기)", "비고"],
    rows: [["시그넷 급속 100kW · 300kW", "11", "설치 시기 2021~2022년 / 운영 기간 약 5년"]],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 렌더
// ═══════════════════════════════════════════════════════════════════════════
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const DAY = 24 * 60 * 60 * 1000;
// 날짜 계산은 실행 머신 타임존과 무관하게 항상 KST 기준.
// ("YYYY-MM-DD"를 new Date()로 파싱하면 UTC 자정이 되어 UTC 이서 타임존에서 하루 밀림)
const parseYMD = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const kstTodayISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }); // YYYY-MM-DD
const daysFromToday = (iso) => Math.round((parseYMD(iso) - parseYMD(kstTodayISO())) / DAY);
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const mdw = (iso) => {
  const d = parseYMD(iso);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
};

const TAG_COLOR = { Proxy: "#2563eb", 펌웨어: "#7c3aed", 검증: "#d97706", EVSIS: "#0d9488" };
const TONE = { blue: "#2563eb", amber: "#d97706", green: "#16a34a" };

function keyDateRows() {
  return DATA.keyDates.map(({ date, label, tag }) => {
    const d = daysFromToday(date);
    const dday = d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : "경과";
    const cls = d === 0 ? "today" : d > 0 ? (d <= 3 ? "soon" : "") : "past";
    const color = TAG_COLOR[tag] ?? "#64748b";
    return `<li class="${cls}">
      <span class="kd">${esc(mdw(date))}<em>${dday}</em></span>
      <span class="kl">${esc(label)}</span>
      <span class="kt" style="color:${color};background:${color}1a">${esc(tag)}</span>
    </li>`;
  }).join("");
}

function checklist(items) {
  return `<ul class="cl">${items.map((it) => `
    <li class="${it.done ? "d" : ""}">
      <i>${it.done ? "✓" : "•"}</i>
      <span>${esc(it.text)}${it.was ? ` <del>(기존 ${esc(it.was)})</del>` : ""}</span>
    </li>`).join("")}</ul>`;
}

function table(t, { firstBold = true } = {}) {
  return `<div class="twrap"><table>
    <thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${t.rows.map((r) => `<tr>${r.map((c, i) =>
      `<td${i === 0 && firstBold ? ' class="b"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function render(generatedAt) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(DATA.title)}</title>
<style>
  :root{--bd:#e2e8f0;--mut:#64748b;--ink:#0f172a}
  *{box-sizing:border-box}
  body{margin:0;background:#f1f5f9;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Segoe UI",Roboto,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
  .doc{max-width:980px;margin:0 auto;padding:28px 20px 48px}
  .card{background:#fff;border:1px solid var(--bd);border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.04);margin-bottom:16px;overflow:hidden}
  .muted{color:var(--mut)}
  header.hd{margin-bottom:18px}
  header.hd h1{font-size:22px;margin:0 0 2px;letter-spacing:-.02em}
  header.hd .sub{font-size:13px;color:var(--mut)}
  h2.sec{display:flex;align-items:center;gap:8px;font-size:15px;margin:0;padding:13px 18px;border-bottom:1px solid var(--bd)}
  h2.sec .no{flex:0 0 auto;width:22px;height:22px;border-radius:7px;background:#2563eb;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .body{padding:16px 18px}
  .note{font-size:13px;color:var(--mut);background:#f8fafc;border:1px solid var(--bd);border-radius:9px;padding:9px 13px;margin:0 0 12px}
  /* 주요 일정 */
  ul.kdl{list-style:none;margin:0;padding:0}
  ul.kdl li{display:flex;align-items:center;gap:12px;padding:8px 18px;border-bottom:1px solid #eef2f6;font-size:13px}
  ul.kdl li:last-child{border-bottom:0}
  ul.kdl li.past{opacity:.5}
  ul.kdl li.today .kd em,ul.kdl li.soon .kd em{color:#dc2626}
  .kd{flex:0 0 92px;font-weight:700;font-variant-numeric:tabular-nums}
  .kd em{display:block;font-style:normal;font-weight:600;font-size:10px;color:var(--mut)}
  .kl{flex:1;min-width:0}
  .kt{flex:0 0 auto;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px}
  /* 전환 일정 */
  .steps{display:flex;gap:12px;flex-wrap:wrap}
  .stepbox{flex:1;min-width:220px;border:1px solid var(--bd);border-radius:10px;padding:13px 15px;background:#f8fafc}
  .stepbox .w{font-size:12px;font-weight:700;color:#2563eb}
  .stepbox .t{font-size:14px;font-weight:600;margin-top:2px}
  /* 체크리스트 */
  .phasebox{border:1px solid var(--bd);border-radius:10px;margin-bottom:12px;overflow:hidden}
  .phasebox:last-child{margin-bottom:0}
  .phasebox .ph{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 14px;background:#f8fafc;border-bottom:1px solid var(--bd);font-size:13.5px;font-weight:600}
  .pstat{font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;margin-left:auto}
  ul.cl{list-style:none;margin:0;padding:6px 14px 10px}
  ul.cl li{display:flex;gap:9px;padding:5px 0;font-size:13.5px}
  ul.cl li i{flex:0 0 18px;height:18px;margin-top:1px;border-radius:50%;font-style:normal;font-size:11px;display:flex;align-items:center;justify-content:center;border:1.5px solid #cbd5e1;color:#94a3b8}
  ul.cl li.d i{background:#16a34a;border-color:#16a34a;color:#fff}
  ul.cl li.d span{color:var(--mut)}
  ul.cl del{color:#94a3b8;font-size:12px}
  /* 표 */
  h3.tt{font-size:13.5px;margin:0 0 8px}
  .twrap{overflow-x:auto;border:1px solid var(--bd);border-radius:10px;margin-bottom:14px}
  .twrap:last-child{margin-bottom:0}
  table{border-collapse:collapse;width:100%;font-size:13px;min-width:560px}
  th{background:#f8fafc;text-align:left;font-weight:600;color:var(--mut);font-size:12px;white-space:nowrap}
  th,td{padding:9px 12px;border-bottom:1px solid #eef2f6;vertical-align:top}
  tbody tr:last-child td{border-bottom:0}
  td.b{font-weight:600;white-space:nowrap}
  footer{margin-top:22px;color:var(--mut);font-size:12px;text-align:center;border-top:1px solid var(--bd);padding-top:14px}
  @media(max-width:640px){.doc{padding:18px 12px 40px}.steps{flex-direction:column}}
  @media print{body{background:#fff}.card{box-shadow:none;break-inside:avoid}}
</style>
</head>
<body>
<main class="doc">
  <header class="hd">
    <h1>${esc(DATA.title)}</h1>
    <div class="sub">${esc(DATA.subtitle)} · 기준 ${esc(generatedAt)}</div>
  </header>

  <section class="card">
    <h2 class="sec"><span class="no">★</span>7월 주요 일정</h2>
    <ul class="kdl">${keyDateRows()}</ul>
  </section>

  <section class="card">
    <h2 class="sec"><span class="no">1</span>전환 일정</h2>
    <div class="body">
      <p class="note">${esc(DATA.transition.note)}</p>
      <div class="steps">${DATA.transition.items.map((s) => `
        <div class="stepbox"><div class="w">${esc(s.when)}</div><div class="t">${esc(s.what)}</div></div>`).join("")}
      </div>
    </div>
  </section>

  <section class="card">
    <h2 class="sec"><span class="no">2</span>Proxy 적용 일정</h2>
    <div class="body">
      ${[DATA.proxy.step1, DATA.proxy.step2].map((st) => `
      <div class="phasebox">
        <div class="ph">${esc(st.title)}
          <span class="pstat" style="color:${TONE[st.statusTone]};background:${TONE[st.statusTone]}1a">${esc(st.status)}</span>
        </div>
        ${checklist(st.items)}
      </div>`).join("")}
    </div>
  </section>

  <section class="card">
    <h2 class="sec"><span class="no">3</span>GS-OCPP 연동 개발 일정</h2>
    <div class="body">
      <h3 class="tt">${esc(DATA.ocppDirect.title)}</h3>
      ${table(DATA.ocppDirect)}
      <h3 class="tt">${esc(DATA.ocppProxyFirst.title)}</h3>
      ${table(DATA.ocppProxyFirst)}
    </div>
  </section>

  <section class="card">
    <h2 class="sec"><span class="no">4</span>EVSIS 관련 일정</h2>
    <div class="body">
      <h3 class="tt">${esc(DATA.evsisUi.title)}</h3>
      ${table(DATA.evsisUi)}
      <h3 class="tt">${esc(DATA.evsisFw.title)}</h3>
      ${table(DATA.evsisFw, { firstBold: false })}
    </div>
  </section>

  <section class="card">
    <h2 class="sec"><span class="no">5</span>Proxy 계속 사용 대상</h2>
    <div class="body">
      <p class="note">${esc(DATA.proxyKeep.note)}</p>
      ${table(DATA.proxyKeep)}
    </div>
  </section>

  <footer>기준 ${esc(generatedAt)} · ${esc(DATA.title)} · GS차지비 내부용 (대외비)</footer>
</main>
</body>
</html>`;
}

// ─── main ─────────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    const env = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

async function main() {
  const generatedAt = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const html = render(generatedAt);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, html, "utf8");

  const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0);
  console.log(`✅ 생성 완료: report/연동일정-충전기술지원팀.html  (${kb} KB)`);
  console.log(`   기준: ${generatedAt}`);

  if (DO_UPLOAD) {
    const env = loadEnv();
    await uploadToR2(html, env, {
      key: env.R2_OBJECT_KEY_SCHEDULE || "연동일정-충전기술지원팀.html",
    });
  } else {
    console.log(`   → R2 업로드까지 하려면: npm run report:schedule:deploy`);
  }
}

main().catch((e) => {
  console.error("❌ 실패:", e.message ?? e);
  process.exit(1);
});

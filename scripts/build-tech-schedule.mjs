/**
 * 충전기술지원팀 연동 관련 일정 → 자체완결 단일 HTML 생성기 (R2 배포용).
 *
 * 소스: reference/개인 페이지 & 공유된 페이지 (노션 내보내기, 대외비) 내용을
 *       최신 일정으로 업데이트해 이 파일 DATA 에 구조화. 내용 변경 시 DATA 만 수정.
 * 출력 HTML에는 키·백엔드 연결이 전혀 없다(완전 정적).
 *
 * 연동 방식 2갈래(요청):
 *   • GS-OCPP 직접 연동(프록시 없음): IMK-EV7 · 대유플러스 — 펌웨어로 서버 직접 연동
 *   • 프록시 우선 연동: EVSIS(이브이시스) · 시그넷 — 프록시로 먼저 연결, 펌웨어는 이후(~12월)
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

// 트랙 색 (로드맵 레인 · 경로 카드 · 일정 태그에서 공통 사용)
const TRACK = {
  transfer: { color: "#2563eb", bg: "#dbeafe", label: "프록시 서버 전환" },
  direct: { color: "#7c3aed", bg: "#ede9fe", label: "GS-OCPP 직접 연동" },
  proxy: { color: "#0d9488", bg: "#ccfbf1", label: "프록시 우선 연동" },
  rollout: { color: "#d97706", bg: "#fef3c7", label: "상면 전환" },
};

// 상단 sticky 탭 네비게이션 (섹션 id 와 일치)
const NAV = [
  { id: "sec-roadmap", label: "로드맵" },
  { id: "sec-keydates", label: "주요 일정" },
  { id: "sec-actions", label: "액션" },
  { id: "sec-risk", label: "리스크" },
  { id: "sec-transition", label: "전환 일정" },
  { id: "sec-routing", label: "연동 방식" },
  { id: "sec-proxy", label: "프록시 전환" },
  { id: "sec-evsis", label: "EVSIS" },
  { id: "sec-keep", label: "Proxy 유지" },
];

// 담당(오너) 칩 색상
const OWNER = {
  "GS차지비": { color: "#2563eb", bg: "#dbeafe" },
  "모니트": { color: "#0d9488", bg: "#ccfbf1" },
  "스마트로": { color: "#d97706", bg: "#fef3c7" },
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA — 일정이 바뀌면 여기만 수정
// ═══════════════════════════════════════════════════════════════════════════
const DATA = {
  title: "충전기술지원팀 연동 관련 일정",
  subtitle: "IMK(아이마켓코리아) 양수도 · 연동 개발/전환",

  // 최상단 로드맵 (월별 스윔레인). from/to = 월(inclusive).
  roadmap: {
    startMonth: 6,
    endMonth: 12,
    currentMonth: 7,
    lanes: [
      { track: "transfer", sub: "기존 충전기 아이마켓 프록시 주소로 전환", from: 6, to: 7, text: "6/5 개발 완료 · 7월 전환 완료 예정" },
      { track: "direct", sub: "IMK-EV7 · 대유플러스", from: 6, to: 8, text: "IMK-EV7 검증 ~7/24 · 대유 시료 7/20 지연" },
      { track: "proxy", sub: "EVSIS · 시그넷", from: 7, to: 12, text: "프록시 연결 → GS-OCPP 펌웨어 ~12월" },
      { track: "rollout", sub: "이관 동의 상면", from: 7, to: 12, text: "7/15 리스트 확정 · 8/1~ GS차지비 전환" },
    ],
  },

  // 7월 주요 일정 (D-day 자동). track = 트랙 키.
  keyDates: [
    { date: "2026-07-03", label: "IMK-EV7 수정 펌웨어 릴리즈 완료", track: "direct" },
    { date: "2026-07-06", label: "IMK-EV7 GS차지비 검증 착수", track: "direct" },
    { date: "2026-07-10", label: "삼성전자DS 평택 16기 현장 테스트 완료 (JC-92B1-7-F1B7)", track: "transfer", done: true },
    { date: "2026-07-10", label: "EVSIS UI 시나리오 전달 — 12.1인치 급속", track: "proxy" },
    { date: "2026-07-15", label: "삼성전자DS 농서동 프록시 테스트 (시그넷 HB14K · 버스충전기 HDP300K, 모니트 동행)", track: "transfer" },
    { date: "2026-07-15", label: "이관 동의 상면 리스트 확정 (→ 8/1~ GS차지비 전환)", track: "rollout" },
    { date: "2026-07-20", label: "대유플러스 시료 전달 (오후) — 지연", track: "direct" },
    { date: "2026-07-24", label: "GS차지비 Proxy 전체 검증 완료 목표 (지연)", track: "transfer" },
    { date: "2026-07-24", label: "IMK-EV7 GS-OCPP 검증 완료 목표", track: "direct" },
    { date: "2026-07-31", label: "EVSIS UI 시나리오 전달 — 24인치 급속/초급속", track: "proxy" },
  ],

  // 리스크 · 지연 항목 (별표 섹션)
  risks: [
    {
      title: "모니트 프록시 TestCase 문서 회신 미수신",
      track: "transfer",
      detail: "모니트 TestCase 문서 회신 미수신. 7/24 완료 조건으로 TC 회신 여부와 별개로 검증 진행 예정.",
      schedule: "TestCase 문서 회신 6/29 → 7/7 미수신 (재회신 미정) · 전체 검증 완료 목표 7/24",
      impact: "TC 미회신 상태로 검증 강행 → 테스트 커버리지·완결성 리스크 (7/24 촉박)",
    },
    {
      title: "모니트 대유플러스 연동 개발·시료 지연",
      track: "direct",
      detail: "대유플러스 DY1007-11R GS-OCPP 연동을 위한 모니트 개발·시료 전달 지속 지연.",
      schedule: "시료 전달 6/19 → 7/9 → 7/20(월) 오후 (재지연) · 검증 착수·완료 지연",
      impact: "7/24 검증 완료 목표 불가 → 완료 재산정 필요 (Proxy 테스트 우선순위)",
    },
  ],

  // 현재 액션 아이템 (진행 중인 작업 · 담당)
  actions: [
    { status: "진행 중", text: "JS테크 IMK-EV7 완속충전기 서버 연동 검증", owner: "GS차지비", due: "7/24" },
    { status: "진행 중", text: "GS차지비향 프록시 연동 검증 (TC 회신과 별개 진행)", owner: "모니트", due: "7/24" },
    { status: "진행 예정", text: "삼성전자DS 농서동 프록시 테스트 (시그넷 HB14K·버스충전기 HDP300K, 모니트 동행)", owner: "GS차지비", due: "7/15" },
    { status: "진행 중", text: "대유플러스 완속충전기 연동 테스트 (완료 후 시료 제공)", owner: "모니트", due: "7/20" },
    { status: "진행 중", text: "삼성 평택 현장 테스트 TC 후속 확인·회신 (JC-92B1-7-F1B7)", owner: "모니트" },
  ],

  transition: {
    note: "기존 5/31 전환 완료 예정이었으나, 계약서 검토 및 전환 동의 확보 일정으로 변경.",
    items: [
      { when: "7/15", what: "이관 동의 상면 리스트 확정" },
      { when: "8/1 ~", what: "확정 리스트 GS차지비 운영 전환 시작" },
    ],
  },

  // ── 모델별 연동 방식 (핵심 구분) ──
  routing: {
    direct: {
      track: "direct",
      tag: "프록시 없음",
      desc: "펌웨어 개발로 GS차지비 서버에 직접 연동 (프록시 미경유)",
      models: [
        {
          name: "JS테크 완속 IMK-EV7",
          qty: "713기",
          facts: [
            ["시료", "6/24 전달 완료"],
            ["펌웨어", "7/3 수정 완료"],
            ["검증", "6/25 ~ 7/24 (7/6 착수)"],
            ["비고", "시료 수령 지연 6/12→6/19→6/24 (모니트 사유)"],
          ],
        },
        {
          name: "대유플러스 완속 DY1007-11R",
          qty: "483기",
          facts: [
            ["시료", "7/20(월) 오후 전달 예정"],
            ["검증", "시료 수령(7/20) 후 착수 · 완료 재산정"],
            ["비고", "시료 수령 지연 6/19→7/9→7/20 (모니트 사유) · Proxy 테스트 우선"],
          ],
        },
      ],
    },
    proxy: {
      track: "proxy",
      tag: "우선",
      desc: "프록시로 먼저 연결 · GS-OCPP 펌웨어 개발은 이후(~12월)",
      models: [
        {
          name: "EVSIS(이브이시스) 완/급속 9모델",
          qty: "498기",
          facts: [
            ["TC 회신", "미수신 (7/7 예정) · 모니트"],
            ["펌웨어", "~ 12월 개발·현장 적용"],
            ["비고", "기존 운영 중 필드이슈 동일 모델(487기)에도 해당 펌웨어 적용 가능"],
          ],
        },
        {
          name: "시그넷 완속 HB14K-EV-C1C1-G1",
          qty: "142기",
          facts: [
            ["TC 회신", "미수신 (7/7 예정) · 모니트"],
            ["펌웨어", "~ 12월 개발·현장 적용"],
          ],
        },
      ],
    },
  },

  // 프록시 서버 전환 (기존 충전기 인프라)
  proxyInfra: {
    step1: {
      title: "단계 1 · 아이마켓코리아 연동 Proxy 개발 및 전환",
      status: "전환 진행 중",
      statusTone: "#2563eb",
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
      statusTone: "#d97706",
      items: [
        { done: true, text: "6/10부터 GS차지비 Proxy 연동 개발 시작, 6/16부터 테스트 진행" },
        { done: true, text: "삼성전자DS 평택 2단지 주차동 16기(미운영 예정) 선전환 현장 테스트 완료 (7/10 · JC-92B1-7-F1B7)" },
        { done: false, text: "7/15 삼성전자DS 농서동 주차장 방문 프록시 테스트 예정 — 시그넷 HB14K-EV-C1C1 · 버스충전기 HDP300K-DCM (모니트 동행)" },
        { done: false, text: "모니트 프록시 TestCase 문서 회신 미수신 — 7/24 완료 조건으로 일정 촉박, TC 회신 여부와 별개로 검증 진행 예정", was: "6/29까지 완료·회신 예정" },
        { done: false, text: "현장 테스트 후속 TC 3건도 모니트 추가 확인 후 회신 예정 (아래 표 참고)" },
        { done: false, text: "GS차지비 Proxy 전체 검증 완료 목표 7/24 (기존 ~7/17 → 지연)" },
      ],
    },
  },

  // 삼성 평택 현장 테스트 후속 TC (모니트 회신 예정)
  samsungTc: {
    title: "삼성 평택 현장 테스트 후속 · 모니트 회신 예정 (JC-92B1-7-F1B7)",
    head: ["TC", "확인 항목 (모니트 추가 확인 후 회신 예정)"],
    rows: [
      ["TC 9-10", "chargingTimeMax 반영 기능 추가 예정"],
      ["TC 11-1 / 11-2 / 11-4 / 12-1 / 12-2", "통신장애 관련 충전기 동작사항 확인 후 회신 예정"],
      ["TC 13-1 ~ 13-3", "RCD 감지 관련 충전기 동작사항 확인 후 회신 예정"],
    ],
  },

  // 삼성 상면 프록시 제약 해소 메모 (조건부·한시)
  proxyMemo: {
    title: "삼성 상면 프록시 제약 해소 (조건부)",
    body: "프록시 서버 제약: 원격 충전 시 회원도 비회원 단가로 적용됨. → GS차지비 영업팀 확인 결과, 삼성 상면은 약 1년간 회원/비회원 단가 260원 동일 적용 예정이라 이 제약이 문제되지 않음(해소).",
    caveat: "삼성 상면 한정 · 약 1년 한시 조건 — 단가 차등 적용 시점에 재검토 필요.",
  },

  evsisUi: {
    title: "UX/UI 시나리오 제공 현황",
    head: ["전달 일정", "화면 크기", "해상도", "전달 여부", "비고"],
    rows: [
      ["6/12 → 6/15", "4.3인치", "800×480", "완료", "GS차지비 측 작업 지연으로 일정 변경 · 신용카드 추가 시나리오 전달"],
      ["6/26 → 6/30", "8인치", "1280×720", "완료", "UI 수정 발견으로 일정 변경 — 충전속도 kWh→kW 표기, 일부 좌우반전 UI 수정 · 시나리오 전달"],
      ["7/10 → 7/14", "12.1인치", "800×600", "완료", "GS차지비 측 작업 지연으로 일정 변경"],
      ["7/31", "24인치", "1080×1920", "진행 예정", ""],
    ],
  },
  evsisFw: {
    title: "펌웨어 개발 일정 및 현황 (9모델 · 498기)",
    head: ["No", "모델명", "타입", "속도(kW)", "UI 사이즈/해상도", "카드리더기", "UI 전달", "차지비 UI 전달", "개발 예정일", "개발 진행"],
    rows: [
      ["1", "JC-92B1-7-01B", "완속", "7", "4.3″ / 800×480", "TL-3700", "6/15", "완료", "8/31", "1순위 (진행중)"],
      ["2", "JC-92B1-7-F1B7", "완속", "7", "4.3″ / 800×480", "TL-3700", "6/15", "완료", "9/30", "2순위"],
      ["3", "JC-9931-50-3", "급속", "50", "12.1″ / 800×600", "TL-3600", "7/14", "완료", "9/30", "2순위"],
      ["4", "JC-9932-100-821", "급속", "100", "12.1″ / 800×600", "TL-3600", "7/14", "완료", "9/30", "2순위"],
      ["5", "JC-9932-100-8216", "급속", "100", "12.1″ / 800×600", "TL-3600", "7/14", "완료", "9/30", "2순위"],
      ["6", "JC-9932-100-CU", "급속", "100", "24″ / 1080×1920", "TL-3600", "7/31", "예정", "9/30", "2순위"],
      ["7", "JC-96S1-200-0W", "초급속", "200", "24″ / 1080×1920", "TL-3600", "7/31", "예정", "9/30", "2순위"],
      ["8", "JC-9111KE-TP-BC", "완속", "7", "8″ / 1280×720", "TL-3500BP", "6/30", "완료", "10/31", "3순위"],
      ["9", "JC-91B2-14-0A1", "완속", "14", "8″ / 1280×720", "TL-3500BP", "6/30", "완료", "10/31", "3순위"],
    ],
  },

  proxyKeep: {
    note: "펌웨어 수정이 불가하여 Proxy를 계속 사용해야 하는 대상",
    head: ["제조사/모델", "수량(기)", "비고"],
    rows: [["시그넷 급속 100kW · 300kW", "11", "설치 시기 2021~2022년 / 운영 기간 약 5년"]],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 유틸
// ═══════════════════════════════════════════════════════════════════════════
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const DAY = 24 * 60 * 60 * 1000;
// 날짜 계산은 실행 머신 타임존과 무관하게 항상 KST 기준.
// ("YYYY-MM-DD"를 new Date()로 파싱하면 UTC 자정이 되어 UTC 이서 타임존에서 하루 밀림)
const parseYMD = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const kstTodayISO = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const daysFromToday = (iso) => Math.round((parseYMD(iso) - parseYMD(kstTodayISO())) / DAY);
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const mdw = (iso) => {
  const d = parseYMD(iso);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
};

// ═══════════════════════════════════════════════════════════════════════════
// 렌더
// ═══════════════════════════════════════════════════════════════════════════
function roadmap() {
  const rm = DATA.roadmap;
  const months = [];
  for (let m = rm.startMonth; m <= rm.endMonth; m++) months.push(m);
  const col = (m) => m - rm.startMonth + 2; // 라벨=1열, 첫 달=2열
  const nCols = months.length;

  const header = months
    .map((m) => `<div class="rm-h${m === rm.currentMonth ? " cur" : ""}" style="grid-row:1;grid-column:${col(m)}">${m}월</div>`)
    .join("");

  const lanes = rm.lanes
    .map((ln, i) => {
      const row = i + 2;
      const t = TRACK[ln.track];
      const c1 = col(ln.from);
      const c2 = col(ln.to) + 1;
      return `
      <div class="rm-lbl" style="grid-row:${row}"><b style="color:${t.color}">${esc(t.label)}</b><small>${esc(ln.sub)}</small></div>
      <div class="rm-bg" style="grid-row:${row}"></div>
      <div class="rm-bar" style="grid-row:${row};grid-column:${c1}/${c2};background:${t.bg};color:${t.color};border-color:${t.color}55">${esc(ln.text)}</div>`;
    })
    .join("");

  return `<div class="rmwrap"><div class="roadmap" style="grid-template-columns:132px repeat(${nCols},minmax(58px,1fr))">${header}${lanes}</div></div>`;
}

function keyDateRows() {
  return DATA.keyDates
    .map(({ date, label, track, done }) => {
      const d = daysFromToday(date);
      const dday = done ? "완료" : d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : "경과";
      const cls = done ? "done" : d === 0 ? "today" : d > 0 ? (d <= 3 ? "soon" : "") : "past";
      const t = TRACK[track];
      return `<li class="${cls}">
      <span class="kd">${esc(mdw(date))}</span>
      <span class="kdd">${dday}</span>
      <span class="kl">${esc(label)}</span>
      <span class="kt" style="color:${t.color};background:${t.color}1a">${esc(t.label)}</span>
    </li>`;
    })
    .join("");
}

function actionRows() {
  return DATA.actions
    .map((a) => {
      const o = OWNER[a.owner] || { color: "#475569", bg: "#f1f5f9" };
      return `<div class="act">
      ${sBadge(a.status)}
      <span class="atext">${esc(a.text)}</span>
      ${a.due ? `<span class="adue">목표 <b>${esc(a.due)}</b></span>` : ""}
      <span class="aowner" style="color:${o.color};background:${o.bg}">${esc(a.owner)}</span>
    </div>`;
    })
    .join("");
}

function riskCards() {
  return DATA.risks
    .map((r) => {
      const t = TRACK[r.track];
      return `<div class="risk">
      <span class="rwarn">⚠</span>
      <div class="rbody">
        <div class="rhead"><b>${esc(r.title)}</b><span class="rtag">지연중</span></div>
        <div class="rdetail">${esc(r.detail)}</div>
        <div class="rline"><span class="rk">일정</span><span>${esc(r.schedule)}</span></div>
        <div class="rline"><span class="rk">영향</span><span>${esc(r.impact)}</span></div>
      </div>
      <span class="kt rtk" style="color:${t.color};background:${t.color}1a">${esc(t.label)}</span>
    </div>`;
    })
    .join("");
}

function routeCard(r) {
  const t = TRACK[r.track];
  const models = r.models
    .map(
      (m) => `<div class="mrow">
      <div class="mh"><span class="mname">${esc(m.name)}</span><span class="mqty">${esc(m.qty)}</span></div>
      <div class="mfacts">${m.facts.map(([k, v]) => `<div class="mfact"><span class="fk">${esc(k)}</span><span>${esc(v)}</span></div>`).join("")}</div>
    </div>`,
    )
    .join("");
  return `<div class="route">
    <div class="rhd" style="background:${t.color}"><b>${esc(t.label)}</b><span>${esc(r.tag)}</span></div>
    <p class="rdesc">${esc(r.desc)}</p>
    ${models}
  </div>`;
}

function memoBlock(m) {
  return `<div class="memo">
    <div class="memo-h">📌 메모 · ${esc(m.title)}</div>
    <div class="memo-b">${esc(m.body)}</div>
    <div class="memo-c">※ ${esc(m.caveat)}</div>
  </div>`;
}

function checklist(items) {
  return `<ul class="cl">${items
    .map(
      (it) => `
    <li class="${it.done ? "d" : ""}"><i>${it.done ? "✓" : "•"}</i><span>${esc(it.text)}${it.was ? ` <del>(기존 ${esc(it.was)})</del>` : ""}</span></li>`,
    )
    .join("")}</ul>`;
}

// 상태 배지 (표 셀 내 완료/진행 중/진행 예정/신규 등을 색상 칩으로)
const SBADGE = {
  "완료": { bg: "#dcfce7", fg: "#15803d" },       // green
  "진행 중": { bg: "#dbeafe", fg: "#2563eb" },      // blue
  "진행중": { bg: "#dbeafe", fg: "#2563eb" },
  "진행 예정": { bg: "#eef2f6", fg: "#475569" },     // slate
  "예정": { bg: "#eef2f6", fg: "#475569" },
  "지연": { bg: "#fee2e2", fg: "#dc2626" },        // red
  "신규": { bg: "#ede9fe", fg: "#7c3aed" },        // violet
};
function sBadge(label) {
  const k = String(label).trim();
  const s = SBADGE[k];
  return s ? `<span class="sb" style="color:${s.fg};background:${s.bg}">${esc(k)}</span>` : esc(label);
}
// 셀을 상태 칩으로: "완료" → 칩, "6/30 (완료)" → 날짜+칩, "-" → 흐린 대시
function statusCell(c) {
  const raw = String(c).trim();
  if (raw === "-" || raw === "") return `<span style="color:#cbd5e1">–</span>`;
  // 순수 상태: "완료"
  if (SBADGE[raw]) return sBadge(raw);
  // 후행 "(상태)": "6/30 (완료)"
  let m = raw.match(/^(.*?)\s*\((완료|예정|진행 중|진행중|지연)\)\s*$/);
  if (m) return `${m[1] ? esc(m[1]) + " " : ""}${sBadge(m[2])}`;
  // 선행 상태 + 설명: "진행 중 (개발 예정일 …)"
  m = raw.match(/^(완료|진행 중|진행중|진행 예정|예정|지연|신규)\s+(.+)$/);
  if (m) return `${sBadge(m[1])} <span style="color:var(--mut)">${esc(m[2])}</span>`;
  return esc(c);
}

function table(t, { firstBold = true, badgeCols = [] } = {}) {
  return `<div class="twrap"><table>
    <thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${t.rows.map((r) => `<tr>${r.map((c, i) => {
      const cls = i === 0 && firstBold ? ' class="b"' : "";
      const inner = badgeCols.includes(i) ? statusCell(c) : esc(c);
      return `<td${cls}>${inner}</td>`;
    }).join("")}</tr>`).join("")}</tbody>
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
  .doc{max-width:1080px;margin:0 auto;padding:28px 20px 48px}
  .card{background:#fff;border:1px solid var(--bd);border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.04);margin-bottom:16px;overflow:hidden}
  @media (prefers-reduced-motion: no-preference){html{scroll-behavior:smooth}}
  section[id]{scroll-margin-top:58px}
  .tabnav{position:sticky;top:0;z-index:20;display:flex;gap:6px;overflow-x:auto;background:#f1f5f9;padding:8px 0;margin-bottom:16px;border-bottom:1px solid var(--bd)}
  .tabnav::-webkit-scrollbar{height:0}
  .tabnav a{flex:0 0 auto;font-size:12.5px;font-weight:600;color:#475569;text-decoration:none;padding:6px 12px;border-radius:8px;white-space:nowrap;border:1px solid transparent;transition:background .12s,color .12s}
  .tabnav a:hover{background:#e2e8f0;color:var(--ink)}
  .tabnav a.active{color:#2563eb;background:#dbeafe;border-color:#bfdbfe}
  .muted{color:var(--mut)}
  header.hd{margin-bottom:18px}
  header.hd h1{font-size:22px;margin:0 0 2px;letter-spacing:-.02em}
  header.hd .sub{font-size:13px;color:#475569}
  h2.sec{display:flex;align-items:center;gap:8px;font-size:15px;margin:0;padding:13px 18px;border-bottom:1px solid var(--bd)}
  h2.sec .no{flex:0 0 auto;width:22px;height:22px;border-radius:7px;background:#0f172a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
  h2.sec .star{background:#f59e0b}
  h2.sec .rstar{background:#dc2626}
  h2.sec .astar{background:#2563eb}
  /* 현재 액션 아이템 */
  .acts{padding:4px 0}
  .act{display:flex;align-items:center;gap:11px;padding:10px 18px;border-bottom:1px solid #eef2f6}
  .act:last-child{border-bottom:0}
  .act .sb{flex:0 0 auto;min-width:56px;text-align:center}
  .atext{flex:1;min-width:0;font-size:13.5px}
  .adue{flex:0 0 auto;font-size:11.5px;font-weight:600;color:#475569;background:#eef2f6;padding:2px 9px;border-radius:6px;white-space:nowrap}
  .adue b{color:#1e293b;font-variant-numeric:tabular-nums}
  .aowner{flex:0 0 auto;font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:6px;white-space:nowrap}
  @media(max-width:640px){.act{flex-wrap:wrap}.act .atext{flex:1 0 100%;order:3}}
  /* 리스크 카드 */
  .risks{padding:14px 18px;display:grid;gap:11px}
  .risk{display:flex;gap:11px;align-items:flex-start;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:10px;padding:12px 14px;background:#fef7f7}
  .rwarn{flex:0 0 auto;font-size:15px;line-height:1.5}
  .rbody{flex:1;min-width:0}
  .rhead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .rhead b{font-size:14px;font-weight:700}
  .rtag{font-size:11px;font-weight:700;color:#dc2626;background:#fee2e2;padding:1px 8px;border-radius:6px}
  .rdetail{font-size:13px;color:#334155;margin-top:5px}
  .rline{display:flex;gap:8px;font-size:12.5px;margin-top:4px}
  .rline .rk{flex:0 0 34px;color:var(--mut);font-weight:600}
  .risk .rtk{flex:0 0 auto;align-self:flex-start}
  @media(max-width:640px){.risk{flex-wrap:wrap}.risk .rtk{margin-left:26px}}
  .body{padding:16px 18px}
  .note{font-size:13.5px;font-weight:500;color:#334155;background:#f1f5f9;border:1px solid var(--bd);border-left:3px solid #94a3b8;border-radius:9px;padding:10px 13px;margin:0 0 12px}
  .memo{margin-top:14px;border:1px solid #bbf7d0;border-left:4px solid #16a34a;background:#f0fdf4;border-radius:10px;padding:12px 14px;font-size:13px}
  .memo-h{font-weight:700;color:#15803d;margin-bottom:5px}
  .memo-b{color:#334155;line-height:1.55}
  .memo-c{margin-top:6px;font-size:12.5px;font-weight:600;color:#b45309}
  /* 로드맵 */
  .rmwrap{overflow-x:auto;padding:16px 18px 18px}
  .roadmap{display:grid;align-items:center;row-gap:8px;min-width:600px}
  .rm-h{grid-row:1;text-align:center;font-size:11.5px;font-weight:600;color:#475569;padding-bottom:6px;border-bottom:2px solid var(--bd)}
  .rm-h.cur{color:#2563eb;font-weight:800;border-bottom-color:#2563eb}
  .rm-lbl{grid-column:1;padding-right:12px;display:flex;flex-direction:column;line-height:1.25}
  .rm-lbl b{font-size:12.5px}.rm-lbl small{font-weight:400;color:#475569;font-size:11px}
  .rm-bg{grid-column:2 / -1;height:28px;background:#f1f5f9;border-radius:7px;align-self:center}
  .rm-bar{height:28px;align-self:center;z-index:1;display:flex;align-items:center;padding:0 11px;font-size:11px;font-weight:600;border:1px solid;border-radius:7px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
  /* 주요 일정 */
  ul.kdl{list-style:none;margin:0;padding:0}
  ul.kdl li{display:flex;align-items:center;gap:14px;padding:8px 18px;border-bottom:1px solid #eef2f6;font-size:13px}
  ul.kdl li:last-child{border-bottom:0}
  ul.kdl li.past{opacity:.55}
  .kd{flex:0 0 66px;font-weight:700;font-variant-numeric:tabular-nums}
  .kdd{flex:0 0 auto;min-width:48px;text-align:center;font-size:10.5px;font-weight:700;color:var(--mut);background:#f1f5f9;border-radius:5px;padding:2px 7px;white-space:nowrap}
  ul.kdl li.today .kdd{color:#fff;background:#dc2626}
  ul.kdl li.soon .kdd{color:#dc2626;background:#fee2e2}
  ul.kdl li.done .kdd{color:#15803d;background:#dcfce7}
  .kl{flex:1;min-width:0}
  .kt{flex:0 0 auto;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap}
  /* 전환 일정 */
  .steps{display:flex;gap:12px;flex-wrap:wrap}
  .stepbox{flex:1;min-width:220px;border:1px solid var(--bd);border-radius:10px;padding:13px 15px;background:#f8fafc}
  .stepbox .w{font-size:12px;font-weight:700;color:#d97706}
  .stepbox .t{font-size:14px;font-weight:600;margin-top:2px}
  /* 모델별 연동 방식 (경로 카드) */
  .routes{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .route{border:1px solid var(--bd);border-radius:11px;overflow:hidden}
  .rhd{display:flex;align-items:center;gap:8px;padding:10px 14px;color:#fff}
  .rhd b{font-size:14px}
  .rhd span{font-size:11px;font-weight:700;background:rgba(255,255,255,.22);padding:2px 8px;border-radius:6px}
  .rdesc{font-size:12.5px;color:#475569;margin:11px 14px 6px}
  .mrow{padding:10px 14px;border-top:1px solid #eef2f6}
  .mh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
  .mname{font-weight:600;font-size:13.5px}
  .mqty{font-size:11px;font-weight:700;color:var(--mut);background:#f1f5f9;padding:1px 8px;border-radius:6px}
  .mfacts{margin-top:6px;display:grid;gap:4px;font-size:12.5px}
  .mfact{display:grid;grid-template-columns:58px 1fr;gap:8px}
  .mfact .fk{color:var(--mut)}
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
  /* 각 열은 한 줄 유지(모델 ID 중간 끊김 방지), 마지막 설명 열만 줄바꿈 */
  td{white-space:nowrap}
  td:last-child{white-space:normal;min-width:170px}
  .sb{display:inline-block;font-size:11px;font-weight:700;padding:1px 8px;border-radius:6px;white-space:nowrap}
  footer{margin-top:22px;color:var(--mut);font-size:12px;text-align:center;border-top:1px solid var(--bd);padding-top:14px}
  @media(max-width:640px){.doc{padding:18px 12px 40px}.steps,.routes{grid-template-columns:1fr}}
  @media print{body{background:#fff}.card{box-shadow:none;break-inside:avoid}.tabnav{display:none}}
</style>
</head>
<body>
<main class="doc">
  <header class="hd">
    <h1>${esc(DATA.title)}</h1>
    <div class="sub">${esc(DATA.subtitle)} · 기준 ${esc(generatedAt)}</div>
  </header>

  <nav class="tabnav" aria-label="섹션 이동">${NAV.map((n) => `<a href="#${n.id}">${esc(n.label)}</a>`).join("")}</nav>

  <section class="card" id="sec-roadmap">
    <h2 class="sec"><span class="no star">★</span>전체 로드맵 <span class="muted" style="font-weight:400;font-size:12px">· 6~12월 · 연동 방식별 진행</span></h2>
    ${roadmap()}
  </section>

  <section class="card" id="sec-keydates">
    <h2 class="sec"><span class="no star">★</span>7월 주요 일정</h2>
    <ul class="kdl">${keyDateRows()}</ul>
  </section>

  <section class="card" id="sec-actions">
    <h2 class="sec"><span class="no astar">★</span>현재 액션 아이템 <span class="muted" style="font-weight:400;font-size:12px">· 진행 중인 작업 · 담당</span></h2>
    <div class="acts">${actionRows()}</div>
  </section>

  <section class="card" id="sec-risk">
    <h2 class="sec"><span class="no rstar">★</span>리스크 · 일정 지연 <span class="muted" style="font-weight:400;font-size:12px">· 주의 필요 항목</span></h2>
    <div class="risks">${riskCards()}</div>
  </section>

  <section class="card" id="sec-transition">
    <h2 class="sec"><span class="no">1</span>전환 일정</h2>
    <div class="body">
      <p class="note">${esc(DATA.transition.note)}</p>
      <div class="steps">${DATA.transition.items.map((s) => `<div class="stepbox"><div class="w">${esc(s.when)}</div><div class="t">${esc(s.what)}</div></div>`).join("")}</div>
    </div>
  </section>

  <section class="card" id="sec-routing">
    <h2 class="sec"><span class="no">2</span>모델별 연동 방식 <span class="muted" style="font-weight:400;font-size:12px">· 프록시 vs 직접(펌웨어) 구분</span></h2>
    <div class="body">
      <div class="routes">
        ${routeCard(DATA.routing.direct)}
        ${routeCard(DATA.routing.proxy)}
      </div>
    </div>
  </section>

  <section class="card" id="sec-proxy">
    <h2 class="sec"><span class="no">3</span>프록시 서버 전환 일정 <span class="muted" style="font-weight:400;font-size:12px">· 기존 충전기 인프라</span></h2>
    <div class="body">
      ${[DATA.proxyInfra.step1, DATA.proxyInfra.step2].map((st) => `
      <div class="phasebox">
        <div class="ph">${esc(st.title)}<span class="pstat" style="color:${st.statusTone};background:${st.statusTone}1a">${esc(st.status)}</span></div>
        ${checklist(st.items)}
      </div>`).join("")}
      <h3 class="tt" style="margin-top:14px">${esc(DATA.samsungTc.title)}</h3>
      ${table(DATA.samsungTc)}
      ${memoBlock(DATA.proxyMemo)}
    </div>
  </section>

  <section class="card" id="sec-evsis">
    <h2 class="sec"><span class="no">4</span>EVSIS 상세 <span class="muted" style="font-weight:400;font-size:12px">· UI 시나리오 · 펌웨어 9모델</span></h2>
    <div class="body">
      <h3 class="tt">${esc(DATA.evsisUi.title)}</h3>
      ${table(DATA.evsisUi, { badgeCols: [3] })}
      <h3 class="tt">${esc(DATA.evsisFw.title)}</h3>
      ${table(DATA.evsisFw, { firstBold: false, badgeCols: [7, 9] })}
    </div>
  </section>

  <section class="card" id="sec-keep">
    <h2 class="sec"><span class="no">5</span>Proxy 계속 사용 대상</h2>
    <div class="body">
      <p class="note">${esc(DATA.proxyKeep.note)}</p>
      ${table(DATA.proxyKeep)}
    </div>
  </section>

  <footer>기준 ${esc(generatedAt)} · ${esc(DATA.title)} · GS차지비 내부용 (대외비)</footer>
</main>
<script>
(function(){
  var nav=document.querySelector('.tabnav'); if(!nav) return;
  var links=nav.querySelectorAll('a'), map={};
  links.forEach(function(a){ map[a.getAttribute('href').slice(1)]=a; });
  var secs=[].slice.call(document.querySelectorAll('section[id]'));
  if(!secs.length) return;
  var prev=null;
  function update(){
    // 활성화 기준선은 섹션의 scroll-margin-top(58px)보다 넉넉히 아래여야
    // 탭 클릭으로 정착한 섹션이 '지나감'으로 잡힌다(직전 탭 잔류 방지).
    var edge=nav.getBoundingClientRect().bottom+22, cur=secs[0].id;
    for(var i=0;i<secs.length;i++){ if(secs[i].getBoundingClientRect().top<=edge) cur=secs[i].id; }
    // 페이지 최하단이면 마지막(짧은) 섹션을 활성화 — top이 nav까지 못 올라오는 문제 보정
    var doc=document.documentElement;
    if(window.innerHeight+window.scrollY>=doc.scrollHeight-2){ cur=secs[secs.length-1].id; }
    links.forEach(function(a){ var on=map[cur]===a; a.classList.toggle('active', on);
      if(on){ a.setAttribute('aria-current','true'); } else { a.removeAttribute('aria-current'); } });
    if(cur!==prev && map[cur]){ prev=cur; var a=map[cur];
      nav.scrollLeft=Math.max(0, a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2); }
  }
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  update();
})();
</script>
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
    await uploadToR2(html, env, { key: env.R2_OBJECT_KEY_SCHEDULE || "연동일정-충전기술지원팀.html" });
  } else {
    console.log(`   → R2 업로드까지 하려면: npm run report:schedule:deploy`);
  }
}

main().catch((e) => {
  console.error("❌ 실패:", e.message ?? e);
  process.exit(1);
});

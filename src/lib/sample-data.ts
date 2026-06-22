import type { Project } from "@/types/project";
import type { Task, TaskPhase } from "@/types/task";

// ============================================================================
// 양수도 사업 체크리스트 시드 데이터
// ----------------------------------------------------------------------------
// reference/ 의 실제 양수도 자료(표준 체크리스트 CSV, 신세계·IMK 진행현황 문서)를
// 기반으로 구성한 체크리스트입니다.
//   • 신세계 I&C 양수도   — 표준 24개 항목 + 딜 고유 항목 (실제 진행 상태 반영)
//   • IMK 양수도          — 프록시 전환 방식 (실제 진행 상태 반영)
//   • 양수도 표준 체크리스트 — 향후 신규 건에 복제하여 쓰는 범용 템플릿 (24개, 시작 전)
// 매핑: project=양수도 건 / phase=단계(1~5) / category=주관 담당팀 /
//       assigneeOrPartner=협력사·상대 / description=상세 Action / memo=비고
// ============================================================================

function iso(date: string, time = "09:00:00"): string {
  return `${date}T${time}.000Z`;
}

// ─── 양수도 건 (projects) ──────────────────────────────────────────────────────

export function getSampleProjects(): Project[] {
  return [
    {
      id: "biz-sse",
      name: "신세계 I&C 양수도",
      description:
        "신세계아이앤씨 EV충전 사업 양수도 — 약 7,331대(에바 5,657·시그넷 1,295·LG·휴맥스·모던텍 등) GS차지비 서버 전환. 전환계획서 base20260529, 6/1 전환 개시.",
      status: "in_progress",
      startDate: "2025-11-17",
      targetDate: "2026-07-31",
      createdAt: iso("2025-11-17"),
      updatedAt: iso("2026-05-29"),
    },
    {
      id: "biz-imk",
      name: "IMK(아이마켓코리아) 양수도",
      description:
        "아이마켓코리아 EV충전 사업 양수도 — 프록시 서버 방식 전환(IMK→GS차지비). 계약서 검토로 5/31 일정 지연, 6~7월 프록시 순차 전환.",
      status: "in_progress",
      startDate: "2026-04-27",
      targetDate: "2026-07-31",
      createdAt: iso("2026-04-27"),
      updatedAt: iso("2026-05-18"),
    },
    {
      id: "biz-template",
      name: "양수도 표준 체크리스트 (템플릿)",
      description:
        "기존 양수도 사례 기반 범용 표준 체크리스트(Phase 1~5, 24개 항목). 신규 양수도 건 시작 시 복제하여 사용.",
      status: "planned",
      createdAt: iso("2026-01-15"),
      updatedAt: iso("2026-01-15"),
    },
  ];
}

// ─── 표준 체크리스트 24개 항목 (reference CSV 기준) ───────────────────────────

interface MasterItem {
  phase: TaskPhase;
  title: string;
  category: string; // 주관(첫 번째) 담당팀 키
  teams: string; // 전체 담당
  action: string; // 상세 Action → description
}

const MASTER: MasterItem[] = [
  // ── Phase 1 · 사전 준비 ──
  {
    phase: 1,
    title: "양수도 대상 충전기 자산 현황 파악",
    category: "asset",
    teams: "구매자산관리팀, 구축관리팀, 네트워크영업팀, 충전기술지원팀",
    action:
      "양수도 대상 충전소·충전기 목록 확보(제조사·모델·수량·권역·설치위치·위경도·한전관리번호). 중요 상면 우선순위(티어리스트) 작성하여 전환 계획에 반영.",
  },
  {
    phase: 1,
    title: "충전기 ID 정보 확인 및 중복 검증",
    category: "tech_support",
    teams: "충전기술지원팀",
    action: "양수도 대상 충전기 ID와 기존 운영 중 ID 간 중복 여부 확인.",
  },
  {
    phase: 1,
    title: "제조사별 충전기 모델 현황 정리",
    category: "tech_support",
    teams: "충전기술지원팀",
    action:
      "모델명·종류(급속/완속)·LTE 모뎀·신용카드 리더기·펌웨어 버전 현황 정리. 모델별 원격 업데이트 가능 여부·현장 방문 필요 여부, PG 신규 연동 필요 여부 파악.",
  },
  {
    phase: 1,
    title: "양도사(기존 CPO) 측 기술 담당자 확인",
    category: "network_sales",
    teams: "네트워크영업팀, 충전기술지원팀",
    action: "양도사 측 기술·운영 담당자 연락처 확보 및 협의 채널 수립, 실무자 컨택포인트 확인.",
  },
  {
    phase: 1,
    title: "제조사별 연동 개발 KickOff",
    category: "deal",
    teams: "Deal팀, 충전기술지원팀",
    action: "제조사별 연동 개발 KickOff 회의 진행. 제조사별 개발 담당자·개발 범위·일정·리스크 논의.",
  },
  {
    phase: 1,
    title: "유관부서 사전 체크포인트 정리",
    category: "tech_support",
    teams: "충전기술지원팀",
    action: "각 부서별 담당자 확정 및 체크포인트 수렴하여 리스트업.",
  },
  {
    phase: 1,
    title: "충전기 기초 정보 등록 방안 확인",
    category: "construction",
    teams: "구축관리팀, 충전기술기획팀",
    action:
      "BPMS·Admin 충전소·충전기 기초 정보 대량(벌크) 등록 가능 여부 확인. 구축 코드 또는 owner_info 등 구분 기준 확인.",
  },
  {
    phase: 1,
    title: "충전기 부착물 관련 내용 정리",
    category: "cx",
    teams: "고객경험팀, 구축관리팀, 마케팅팀",
    action:
      "충전기 부착 스티커·QR코드·안내문·브랜드 로고 등 부착물 종류·수량·상태 파악. 부착물 교체 주체 및 일정 수립.",
  },
  {
    phase: 1,
    title: "GS차지비 연동용 chargerID, 충전기번호(cno) 기준 정리",
    category: "asset",
    teams: "구매자산관리팀, 구축관리팀, 충전기술지원팀",
    action:
      "서버 연동용 chargerID 값과 화면 표시용 충전기 번호(cno) 기준 수립. 기존 충전기 부착물과 실제 표시 가능 여부 확인.",
  },
  // ── Phase 2 · 계약/연동 준비 ──
  {
    phase: 2,
    title: "PG사 선정 및 계약 진행(필요시)",
    category: "planning",
    teams: "기획관리팀",
    action: "PG 신규 연동 필요 시 대상 PG사 계약 서류 준비·체결.",
  },
  {
    phase: 2,
    title: "PG사 결제 방식 확인 및 테스트 준비",
    category: "tech_planning",
    teams: "충전기술기획팀, 충전기술지원팀, 플랫폼개발팀",
    action:
      "신용카드 결제 방식 결정(승인-취소, 부분취소 주체 확인). 제조사·PG사별 부분취소 지원 여부 확인.",
  },
  {
    phase: 2,
    title: "MID(상점ID) 운영 방안 결정",
    category: "planning",
    teams: "기획관리팀, 충전기술지원팀",
    action: "기존 MID 유지 또는 신규 발급 여부 결정.",
  },
  {
    phase: 2,
    title: "신용카드 리더기 설정 매뉴얼 작성",
    category: "tech_support",
    teams: "충전기술지원팀",
    action: "충전기에 장착된 신용카드 리더기 종류별 설정 매뉴얼 작성.",
  },
  {
    phase: 2,
    title: "PG 결제 흐름도 작성",
    category: "tech_planning",
    teams: "충전기술기획팀, 충전기술지원팀, 플랫폼개발팀",
    action: "충전기 / 통신서버 / Kafka / OMS 등 결제 흐름도 작성.",
  },
  // ── Phase 3 · 연동 개발 및 전환 일정 수립 ──
  {
    phase: 3,
    title: "펌웨어 연동 개발 진행",
    category: "tech_support",
    teams: "충전기술지원팀",
    action: "제조사별 GS차지비 서버 연동 펌웨어 개발. 개발 시작/목표일 관리.",
  },
  {
    phase: 3,
    title: "PG사 신규 연동 시 주문, 결제 처리 관련 개발",
    category: "tech_planning",
    teams: "충전기술기획팀, 플랫폼개발팀",
    action:
      "충전기에서 통신서버로 전송하는 DT전문 정의(기존 정의 활용 가능 여부 확인). OMS 결제 처리 개발.",
  },
  {
    phase: 3,
    title: "신용카드 리더기 결제 테스트",
    category: "tech_support",
    teams: "충전기술지원팀",
    action: "테스트용 리더기 시료 확보 후 사무실/실충전기 결제 테스트 진행.",
  },
  {
    phase: 3,
    title: "펌웨어 업데이트 매뉴얼 수령",
    category: "tech_support",
    teams: "충전기술지원팀",
    action: "현장 및 원격 펌웨어 업데이트 매뉴얼 확보.",
  },
  {
    phase: 3,
    title: "전환 계획서 작성 및 공유",
    category: "tech_support",
    teams: "충전기술지원팀",
    action:
      "모델별 전환 순서·일정·일정별 업데이트 수량·투입 인원 포함한 전환 계획서 초안 작성. 양도사 논의 후 내부 유관부서 공유.",
  },
  // ── Phase 4 · 검증 및 테스트 ──
  {
    phase: 4,
    title: "제조사·모델별 연동 검증",
    category: "tech_support",
    teams: "충전기술지원팀",
    action: "개발 완료된 펌웨어로 TestCase 수행.",
  },
  {
    phase: 4,
    title: "전환 테스트 진행",
    category: "tech_support",
    teams: "충전기술지원팀",
    action:
      "기존 CPO → GS차지비 서버 전환 테스트. 펌웨어 단계별(Downloading→Downloaded→Installing→Installed) 실패 시 동작상태·대응 방안 정리.",
  },
  // ── Phase 5 · 전환 실행 ──
  {
    phase: 5,
    title: "충전기 부착물 부착",
    category: "construction",
    teams: "구축관리팀, 네트워크유지보수팀",
    action: "전환 시작 후 충전기 부착물 부착 일정에 맞춰 진행.",
  },
  {
    phase: 5,
    title: "충전기 펌웨어 원격 업데이트 진행",
    category: "tech_support",
    teams: "충전기술지원팀",
    action:
      "원격 업데이트 가능 모델에 대해 이전 CPO 운영 시스템에서 원격 업데이트 진행, 진척도 관리. 서버 미접속(미아) 충전기 식별 및 현장 대응.",
  },
  {
    phase: 5,
    title: "충전기 펌웨어 현장 업데이트 진행",
    category: "tech_support",
    teams: "충전기술지원팀",
    action:
      "현장 업데이트 대상 모델에 대해 현장 방문하여 펌웨어 업데이트. 인원 투입처 사전 확정, 현장 대응 매뉴얼 확인.",
  },
];

// ─── 사업 실사·계약 이관·정산·인허가 워크스트림 (slack 실사 TF 기준) ───────────
// 경영기획·Deal·구매자산·법무 주관. 표준 템플릿 + 신세계 건에 공통 적용.

const MASTER_BIZ: MasterItem[] = [
  {
    phase: 1,
    title: "양도대상 계약 범위 확정",
    category: "deal",
    teams: "Deal팀, 경영기획부문, 구매자산관리팀",
    action:
      "충전기 구매계약·유지보수 용역·로밍·간편결제·결제대행 등 계약별 양도/제외 범위 확정. (warranty 관련 구매계약은 일체 양도)",
  },
  {
    phase: 1,
    title: "사업·재무·세무 실사 수행",
    category: "biz_planning",
    teams: "경영기획부문, 기획관리팀, 구매자산관리팀",
    action:
      "자산실사·재무실사·세무실사 및 현장실사 수행. 자산 확정, 미설치 충전기 재고·취득세·CCTV·내용연수 등 검토.",
  },
  {
    phase: 1,
    title: "충전기 구매계약 및 하자보증증권 이관",
    category: "asset",
    teams: "구매자산관리팀, 경영기획부문",
    action:
      "충전기 구매계약 일체 양도(warranty). 하자보증 기간 잔존 상면에 대한 하자보증증권 이관 절차 확인.",
  },
  {
    phase: 2,
    title: "상면 계약서 검토 및 본계약 체결",
    category: "deal",
    teams: "Deal팀, 경영기획부문, 법무팀",
    action:
      "상면(부지) 계약서 실사·검토 후 본계약 체결. 연동·펌웨어 작업은 GS차지비가 제조사를 통해 수행하며 양도사 협력 의무 명시.",
  },
  {
    phase: 1,
    title: "이관 동의서(상면/부지) 확보",
    category: "network_sales",
    teams: "네트워크영업팀, Deal팀",
    action:
      "위탁운영 상면·부지 이관 동의서 확보. GS차지비 직접계약 희망 상면 리스트업. 미동의 사이트 처리 방안 수립.",
  },
  {
    phase: 1,
    title: "보조금 사업권 이관 및 환경공단 승인",
    category: "biz_planning",
    teams: "경영기획부문, 기획관리팀",
    action:
      "보조금 대상 충전기 소유권 이전에 대한 한국환경공단 승인(사업수행능력 입증, 전기사업법·OCPP 인증·무공해차 누리집 연계). 보조금 계정 이관, 미수취 보조금 closing 전 정리.",
  },
  {
    phase: 1,
    title: "급속 프로모션 종료 협의",
    category: "planning",
    teams: "기획관리팀, 경영기획부문",
    action:
      "완속 다수 사이트 의무설치 급속(저이용률)에 대해 양도사가 자체 프로모션 종료 후 이관하도록 협의(이관 후 종료 시 여론 리스크 회피).",
  },
  {
    phase: 1,
    title: "우발채무·진술보장 및 손해배상 범위 협의",
    category: "legal",
    teams: "법무팀, Deal팀, 경영기획부문",
    action:
      "보조금 반환 사유·미납 조세·미완료 인허가 등 우발채무에 대한 진술보장·손해배상책임 기간 협의(개통 후 1~2년 시점 인지 가능).",
  },
  {
    phase: 1,
    title: "행위신고·전기안전점검 등 인허가 이관",
    category: "safety",
    teams: "안전관리팀, 네트워크구축관리팀",
    action:
      "행위신고·전기안전점검 완료 여부 확인(거래 선행조건, 불법시설물 행정명령 리스크). 전기안전관리자 선임(한전 명의변경 후), 법정 정기검사 대상 확인.",
  },
  {
    phase: 1,
    title: "충전시설 신고 (지자체)",
    category: "construction",
    teams: "네트워크구축관리팀",
    action:
      "충전시설 신고 완료. 연동 후 신고는 지자체별 대응 불가하므로 사전 완료 필요. 양도사 신고완료 후 변경신고.",
  },
  {
    phase: 2,
    title: "VAN/PG 결제 구조 확인 및 PG 명의이전",
    category: "tech_planning",
    teams: "충전기술기획팀, 기획관리팀",
    action:
      "VAN사(나이스/헥토) 사용 현황 및 결제 중계 구조 확인. 오프라인 비회원 결제 PG 명의를 양도사→GS차지비로 이전.",
  },
  {
    phase: 5,
    title: "한전 전기요금 명의변경 및 정산",
    category: "construction",
    teams: "네트워크구축관리팀, 구매자산관리팀",
    action:
      "한전 전기요금 명의 일괄 변경(한전ON 계정). 거래종결일 기준 검침일·세금계산서 주체에 따라 일할 정산.",
  },
  {
    phase: 5,
    title: "통신 회선 약정 명의변경",
    category: "construction",
    teams: "네트워크구축관리팀",
    action:
      "양도사 직영 통신 약정을 차지비 담당 대리점으로 양도. 잔여 약정기간 통신 수수료 일괄지급 절차 확인.",
  },
  {
    phase: 5,
    title: "로밍 매출 정산 및 로밍 중단",
    category: "planning",
    teams: "기획관리팀, 경영기획부문",
    action:
      "양도사가 서버 연동일/특정일 기준 로밍 서비스 중단 고지 후 각 사와 정산. 이후 GS차지비 충전기 사용분은 차지비가 정산.",
  },
  {
    phase: 5,
    title: "유지보수 용역 이관 (SK네트웍스서비스 → GS엠비즈)",
    category: "network_maint",
    teams: "네트워크유지보수팀, 구매자산관리팀",
    action:
      "기존 유지보수 용역(SK네트웍스서비스)은 양도 제외, 전환 후 GS엠비즈 용역범위로 이관. 엠비즈 정기점검 단가 적용.",
  },
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// ─── 신세계 I&C 양수도: 표준 항목별 실제 진행 상태 오버라이드 ───────────────────

const SSE_OVERRIDES: Record<number, Partial<Task>> = {
  0: {
    status: "done",
    assigneeOrPartner: "신세계I&C, 네트워크구축관리팀",
    memo: "자산확정 기준 20251117. 충전기현황표 확보 — 총 약 7,331대(에바 5,657·시그넷 1,295 등).",
    startDate: "2025-11-17",
    completedAt: iso("2026-02-25"),
  },
  1: {
    status: "done",
    memo: "충전기ID는 기존 신세계I&C ID 유지 — GS차지비 운영 중 ID와 중복 없음 확인 완료.",
    completedAt: iso("2026-02-25"),
  },
  2: {
    status: "done",
    memo: "모델별 현황표 작성(20260316). LG·시그넷·에바·휴맥스·모던텍 — 종류·모뎀·리더기·펌웨어·원격가능여부 정리.",
    completedAt: iso("2026-03-16"),
  },
  3: {
    status: "done",
    assigneeOrPartner: "신세계I&C, 모니트(채호병 전무)",
    memo: "양도사 측 기술·운영 컨택 채널 수립.",
  },
  4: {
    status: "done",
    assigneeOrPartner: "LG전자·SK시그넷·에바·휴맥스·모던텍",
    memo: "제조사별 연동개발 KickOff 진행. 모던텍 연동개발 계약 날인 완료(4/6).",
  },
  5: {
    status: "done",
    memo: "3/18 유관부서 확인사항 정리 → 3/19 에스컬레이션, 내부 점검회의 진행.",
    completedAt: iso("2026-03-19"),
  },
  6: {
    status: "in_progress",
    assigneeOrPartner: "구축관리팀",
    memo: "BPMS 대량(벌크) 등록 1차 확인 — 확실한 검증 필요. 구축코드/owner_info 구분.",
  },
  7: {
    status: "in_progress",
    assigneeOrPartner: "마케팅팀, 고객경험팀",
    memo: "VMD 규격(크기·재질)·모델별 부착현황 확인, 교체 일정 협의(상업시설/아파트 구분). 사전안내문 download형 준비.",
  },
  8: {
    status: "done",
    assigneeOrPartner: "네트워크구축팀, 구매자산관리팀",
    memo: "CNO 6자리 확정(26.03.18). 충전소ID 10자리·충전기ID 11자리(구분+타입+지역+시퀀스) 규칙 수립.",
    completedAt: iso("2026-03-18"),
  },
  9: {
    status: "in_progress",
    priority: "high",
    assigneeOrPartner: "헥토파이낸셜, 기획관리팀(서연우)",
    memo: "헥토PG 계약 서류 준비 중(약 2주 소요). 공MID 사전 발급하여 테스트 사용 후 라이센스키 이관.",
    dueDate: "2026-06-13",
  },
  10: {
    status: "done",
    memo: "승-취 방식 결정. LGE·스마트로 부분취소: 충전기 / 그 외 헥토 부분취소: CPO(서버).",
    completedAt: iso("2026-03-05"),
  },
  11: {
    status: "done",
    assigneeOrPartner: "헥토파이낸셜, 스마트로",
    memo: "헥토 신규 MID 발급·하나로 통일(TID 이관). 스마트로: 신세계I&C MID 유지 이관(LGE 급속 22대). 신세계 MID=충전소ID.",
    completedAt: iso("2026-03-05"),
  },
  12: {
    status: "done",
    assigneeOrPartner: "나이스정보통신",
    memo: "NVCAT(TCP-20-i2)·NKR-1000 신용카드 단말기 설정 매뉴얼 확보.",
  },
  13: {
    status: "done",
    assigneeOrPartner: "충전기술기획팀, 플랫폼개발팀",
    memo: "충전기/통신서버/Kafka/OMS 결제 흐름도 초안 작성(20260223, mermaid).",
  },
  14: {
    status: "in_progress",
    priority: "high",
    assigneeOrPartner: "LG전자·SK시그넷·에바·휴맥스·모던텍",
    memo: "LG EVD100 3/27·시그넷 SC7K 3/10·에바 4/3·휴맥스 4/3 개발완료. 시그넷 FC50/100/200 진행 중, 모던텍 Holding.",
  },
  15: {
    status: "in_progress",
    assigneeOrPartner: "충전기술기획팀(한재홍), 플랫폼개발팀(이혜인)",
    memo: "헥토 DT전문/CSMS→OMS 포맷 정의, NON-UI(빌링키) 결제 처리 개발 진행. Kafka 1차 작업·포맷 정의 완료.",
  },
  16: {
    status: "done",
    assigneeOrPartner: "나이스정보통신",
    memo: "노트북 환경 신용카드 결제·승인취소 테스트 완료(3/12). 모던텍 충전 결제 테스트(3/17~20).",
    completedAt: iso("2026-03-20"),
  },
  17: {
    status: "in_progress",
    assigneeOrPartner: "SK시그넷",
    memo: "펌웨어 릴리즈 시 유지보수용 매뉴얼(제어화면 진입·출력/SoC 설정)·에러코드 정의표 수령 필요.",
  },
  18: {
    status: "done",
    assigneeOrPartner: "신세계I&C",
    memo: "전환계획서 base20260225 → 최종 (f)5.28 base20260529 확정·공유.",
    completedAt: iso("2026-05-28"),
  },
  19: {
    status: "in_progress",
    memo: "모델별 TestCase 수행. 시그넷 FC 3차 검증 5/22, 에바 E01AS007KR0101 내부검증 4/30 완료.",
  },
  20: {
    status: "in_progress",
    priority: "high",
    assigneeOrPartner: "신세계I&C",
    memo: "완속 전환테스트 4/9·4/10·4/17·4/28(에바 성공). 급속 4/30(LG EVD100 정상전환)·5/28(휴맥스 AK타워 레스케이프호텔).",
  },
  21: {
    status: "new",
    assigneeOrPartner: "구축관리팀, 네트워크유지보수팀, GS엠비스",
    memo: "전환 시작 후 부착물 부착. GS엠비스 정기점검 시 신세계 상면 우선 대응(~4개월 소요).",
  },
  22: {
    status: "in_progress",
    priority: "high",
    memo: "원격 업데이트: 에바 5,657대(74.6%) 등. 6/1 전환 개시(90개소·670대). 미아(서버 미접속) 충전기 식별·현장 대응.",
    startDate: "2026-06-01",
    dueDate: "2026-07-31",
  },
  23: {
    status: "in_progress",
    priority: "high",
    assigneeOrPartner: "SK시그넷 CS, 네트워크유지보수팀",
    memo: "현장 업데이트: 시그넷 급속(485케이블 동반)·LG(OTA 불가)·휴맥스. 인원 투입처 사전 확정.",
    chargerModel: "FC50K-B-G1 / FC100K-B2-G5 / FC200K-B-G1",
  },
};

// 신세계 — 사업/계약 워크스트림(MASTER_BIZ) 실제 진행 상태 오버라이드
const SSE_BIZ_OVERRIDES: Record<number, Partial<Task>> = {
  0: {
    status: "done",
    assigneeOrPartner: "경영기획부문(이상준), Deal팀",
    memo: "구매계약(warranty)은 일체 양도. 유지보수(SK네트웍스서비스)·에바 로밍계약·스마일페이 간편결제는 양도 제외 정리.",
    completedAt: iso("2025-09-25"),
  },
  1: {
    status: "done",
    assigneeOrPartner: "경영기획부문, 송보민(GS에너지), 법무팀, 기획관리팀(김나현)",
    memo: "자산실사_통합_250701, 재무/세무실사, 현장실사(7~8월). 자산 확정 20251117(약 7,331대). 미설치 재고·취득세·CCTV·내용연수(완속5/급속7년) 검토.",
    startDate: "2025-07-03",
    completedAt: iso("2025-11-17"),
  },
  2: {
    status: "in_progress",
    memo: "충전기 구매계약 일체 양도(warranty). 하자보증 잔존 상면 보증증권 이관 절차 확인(홈앤서비스 사례 참조).",
  },
  3: {
    status: "done",
    priority: "high",
    assigneeOrPartner: "Deal팀, 경영기획부문, 법무팀",
    memo: "비밀유지조항으로 양도사 본사 방문 확인. 본계약 ~9/25. 연동/펌웨어는 GS차지비가 제조사 통해 수행·양도사 협력 조항 명시.",
    completedAt: iso("2025-09-25"),
  },
  4: {
    status: "in_progress",
    priority: "high",
    memo: "위탁운영 상면·부지 이관 동의 확보. 직접계약 희망 상면 리스트업. 신세계 협조도 이슈. 6월 초 이관동의 상면 수량 확인.",
  },
  5: {
    status: "in_progress",
    priority: "high",
    assigneeOrPartner: "경영기획부문, 기획관리팀",
    memo: "보조금 충전기 소유권 이전 → 환경공단 승인(사업수행능력 입증·전기사업법·OCPP1.6·무공해차 누리집). 보조금 계정 환경공단 통해 GS명의 이관. 미수취 보조금 closing 전 정리.",
  },
  6: {
    status: "in_progress",
    memo: "완속 다수 사이트 의무설치 급속(이용률 저조) — 신세계 자체 프로모션 종료 후 이관 요청(이관 후 종료 시 여론 리스크).",
  },
  7: {
    status: "done",
    assigneeOrPartner: "Deal팀, 법무팀",
    memo: "보조금 반환·미납조세·미완료 인허가 등 우발채무 → 손해배상책임 기간 협의. 개통 후 1~2년 시점 인지 가능.",
  },
  8: {
    status: "in_progress",
    assigneeOrPartner: "안전관리팀(김병삼), 한동씨앤이",
    memo: "행위신고·전기안전점검 완료 여부 확인(불법시설물 행정명령 리스크). 전기안전관리자 한전 명의변경 후 선임(기존 선임신고증명서 사본 필요), 2026 정기검사 대상 확인.",
  },
  9: {
    status: "in_progress",
    priority: "high",
    assigneeOrPartner: "네트워크구축관리팀(김송요)",
    memo: "5/27까지 신고 완료 요청. 연동 후 신고는 지자체별 대응 불가. 신세계 신고완료 후 변경신고.",
    dueDate: "2026-05-27",
  },
  10: {
    status: "done",
    assigneeOrPartner: "충전기술기획팀, 기획관리팀",
    memo: "오프라인 비회원 결제 PG 신세계→GS차지비 명의이전 수용. VAN 나이스/헥토 혼용(나이스→헥토 중계). 결제대행 계약상대=세틀뱅크(헥토).",
    completedAt: iso("2025-09-25"),
  },
  11: {
    status: "new",
    memo: "한전 명의 일괄 변경. 거래종결일 기준 일할 정산(검침일·세금계산서 주체). 신세계 빌링사 미사용, 한전ON 계정 공유.",
  },
  12: {
    status: "new",
    memo: "신세계 직영 통신 약정 → 차지비 대리점 양도. 잔여 약정기간 통신 수수료 일괄지급 절차 확인.",
  },
  13: {
    status: "new",
    memo: "신세계가 서버 연동일/특정일 기준 로밍 중단 고지 후 각사 정산. 이후 차지비 충전기 사용분은 차지비 정산.",
  },
  14: {
    status: "new",
    memo: "SK네트웍스서비스 유지보수 용역은 양도 제외 → 전환 후 GS엠비즈 용역범위 포함. 엠비즈 정기점검 단가 적용.",
  },
};

// 신세계 딜 고유 항목 (표준 체크리스트 외)
const SSE_EXTRA: Task[] = [
  {
    id: "sse-x1",
    title: "모던텍 충전기 처리 방안 결정 (법정관리 리스크)",
    status: "hold",
    priority: "urgent",
    category: "tech_support",
    phase: 3,
    projectId: "biz-sse",
    assigneeOrPartner: "모던텍",
    chargerModel: "MC-DP240-2AA",
    description:
      "모던텍 모델 GS차지비 검증 Fail(4/13~14) → 디버깅(~4/24) → 재검증 4/27~ Holding.",
    nextAction: "현장 실사 및 보조금 대상 검토 후 펌웨어 개발 지속 / 충전기 교체 여부 결정",
    memo: "모던텍 법정관리. 4/30 개발 책임자·담당자 퇴사. 개발자 프리랜서 전환 계약 또는 충전기 교체 논의 필요.",
    createdAt: iso("2026-04-13"),
    updatedAt: iso("2026-05-11"),
  },
  {
    id: "sse-x4",
    title: "고객센터 착신전환 및 회원 전환 안내",
    status: "new",
    priority: "normal",
    category: "cx",
    phase: 5,
    projectId: "biz-sse",
    assigneeOrPartner: "고객경험팀(장영지)",
    description:
      "신세계 자체 회원 대상 양수도 서비스 전환 안내 채널·일정 수립. 스파로스 고객센터 → 차지비 고객센터 자동 착신전환.",
    nextAction: "착신전환 물리적 가능 여부 및 유지 일정 협의",
    memo: "전환 안내 채널/일정 및 콜센터 이관 협의 필요.",
    createdAt: iso("2026-03-18"),
    updatedAt: iso("2026-03-19"),
  },
  {
    id: "sse-x5",
    title: "광고형 급속 LCD Display 표시 이미지 검토 (LGE·휴맥스)",
    status: "in_progress",
    priority: "normal",
    category: "marketing",
    phase: 2,
    projectId: "biz-sse",
    assigneeOrPartner: "마케팅팀(임지선)",
    description: "광고형 충전기(급속) LCD Display 표시 이미지 검토 요청 건.",
    memo: "요청 메일 발송(20260224). VMD 규격·모델별 부착현황 연계 검토.",
    createdAt: iso("2026-02-24"),
    updatedAt: iso("2026-03-18"),
  },
  {
    id: "sse-x6",
    title: "신세계 충전기 전환 현황판 개발",
    status: "done",
    priority: "normal",
    category: "platform",
    phase: 4,
    projectId: "biz-sse",
    assigneeOrPartner: "플랫폼개발팀",
    description: "전환 진척도 모니터링용 현황판 개발.",
    relatedLink: "https://doevdyuzyxd33.cloudfront.net/chargers/",
    memo: "운영 서버 배포 및 검증(4/27~).",
    createdAt: iso("2026-04-23"),
    updatedAt: iso("2026-04-27"),
    completedAt: iso("2026-04-27"),
  },
];

function sseTasks(): Task[] {
  const techBase: Task[] = MASTER.map((m, i) => ({
    id: `sse-${pad2(i + 1)}`,
    title: m.title,
    status: "new",
    priority: "normal",
    category: m.category,
    phase: m.phase,
    projectId: "biz-sse",
    description: m.action,
    createdAt: iso("2026-02-25"),
    updatedAt: iso("2026-05-29"),
    ...SSE_OVERRIDES[i],
  }));
  const bizBase: Task[] = MASTER_BIZ.map((m, i) => ({
    id: `sse-b${pad2(i + 1)}`,
    title: m.title,
    status: "new",
    priority: "normal",
    category: m.category,
    phase: m.phase,
    projectId: "biz-sse",
    description: m.action,
    createdAt: iso("2025-07-03"),
    updatedAt: iso("2025-11-17"),
    ...SSE_BIZ_OVERRIDES[i],
  }));
  return [...techBase, ...bizBase, ...SSE_EXTRA];
}

// ─── IMK(아이마켓코리아) 양수도: 프록시 전환 방식 (실제 진행 상태) ──────────────

function imkTasks(): Task[] {
  return [
    {
      id: "imk-01",
      title: "IMK 양수도 유관부서 회의",
      status: "done",
      priority: "normal",
      category: "deal",
      phase: 1,
      projectId: "biz-imk",
      description: "IMK 양수도 관련 유관부서 회의 및 스마트로 MID 담당자 회의.",
      memo: "260427 유관부서 회의 / 260428 스마트로 MID 관련 담당자 회의 진행.",
      createdAt: iso("2026-04-27"),
      updatedAt: iso("2026-04-28"),
      completedAt: iso("2026-04-28"),
    },
    {
      id: "imk-02",
      title: "충전기 모델별 현황 체크리스트 작성",
      status: "done",
      priority: "normal",
      category: "tech_support",
      phase: 1,
      projectId: "biz-imk",
      assigneeOrPartner: "모니트",
      description: "IMK 양수도 대상 충전기 모델별 현황 정리.",
      memo: "IMKEV(IMK-EV7)·시그넷·이브이시스 모델 현황(260513 업데이트).",
      createdAt: iso("2026-04-28"),
      updatedAt: iso("2026-05-13"),
      completedAt: iso("2026-05-13"),
    },
    {
      id: "imk-03",
      title: "충전기 ID / CNO 부여 기준 검토",
      status: "in_progress",
      priority: "normal",
      category: "tech_support",
      phase: 1,
      projectId: "biz-imk",
      assigneeOrPartner: "충전기술기획팀, 네트워크구축팀, 구매자산관리팀",
      description:
        "충전기ID는 기존 IMK-ID 그대로 사용(충전소ID 8자리=IMK+6자리 Seq + 충전기ID 2자리). CNO 별도 부여 여부 검토.",
      nextAction: "CNO 부여 시점·주체 협의 (이해관계자 다수)",
      memo: "충전기 번호(CNO)=고객 서비스용 ID / Charger ID=충전기 접속 식별 ID.",
      createdAt: iso("2026-04-28"),
      updatedAt: iso("2026-05-13"),
    },
    {
      id: "imk-04",
      title: "스마트로 MID 운영 방안 결정",
      status: "done",
      priority: "normal",
      category: "planning",
      phase: 2,
      projectId: "biz-imk",
      assigneeOrPartner: "스마트로",
      description: "현 IMK MID 유지 이관 여부 결정.",
      memo: "5/31 기존 설정 MID 이관으로 결정(4/28 회의). 결제방식 승취(충전기 부분취소).",
      createdAt: iso("2026-04-28"),
      updatedAt: iso("2026-05-18"),
      completedAt: iso("2026-04-28"),
    },
    {
      id: "imk-05",
      title: "양수도 계약서 검토",
      status: "review",
      priority: "high",
      category: "deal",
      phase: 2,
      projectId: "biz-imk",
      assigneeOrPartner: "Deal팀",
      description: "IMK 양수도 계약서 검토.",
      memo: "계약서 검토 중으로 기존 5/31 전환 완료 예정 일정 지연. 전환 일정 전반에 영향.",
      createdAt: iso("2026-04-27"),
      updatedAt: iso("2026-05-18"),
    },
    {
      id: "imk-06",
      title: "기존 IMK 충전기 운영 시나리오 정리",
      status: "in_progress",
      priority: "normal",
      category: "tech_support",
      phase: 1,
      projectId: "biz-imk",
      assigneeOrPartner: "이브이시스",
      description: "모델별 충전 시나리오·이용 매뉴얼 정리.",
      memo: "IMK-EV7 충전 시나리오(20260417)·시그넷 매뉴얼 확보. 이브이시스(완속 4.3/8″·급속 12.1/24″) 제작 중.",
      createdAt: iso("2026-04-17"),
      updatedAt: iso("2026-04-27"),
    },
    {
      id: "imk-07",
      title: "프록시 서버 운영 방안 / 접속 URL 변경 설정",
      status: "in_progress",
      priority: "high",
      category: "tech_support",
      phase: 3,
      projectId: "biz-imk",
      assigneeOrPartner: "모니트",
      chargerModel: "IMK-EV7",
      description:
        "충전기 서버 접속 URL 변경 설정(아이마켓→GS차지비 리다이렉트). 충전기 번호 관리 체계 확인.",
      nextAction: "URL 변경 현장 작업 및 충전기 번호 관리 체계 회신 확인",
      memo: "URL 변경 현장 작업 필요(260427 모니트 확인).",
      createdAt: iso("2026-04-27"),
      updatedAt: iso("2026-05-18"),
    },
    {
      id: "imk-08",
      title: "적용 OCPP 전문 정의 확인",
      status: "in_progress",
      priority: "normal",
      category: "tech_planning",
      phase: 3,
      projectId: "biz-imk",
      assigneeOrPartner: "모니트",
      description:
        "BootNotification/StatusNotification/Start·StopTransaction/MeterValues 등 OCPP 1.6 + DT(ServerAuth·icpayreport·GetChargeAmount) 전문 확인.",
      memo: "시그넷은 자체 프로토콜 운영 — 추가 확인 필요. GS-OCPP TC 기준 지원 전문 확인 중(모니트).",
      createdAt: iso("2026-04-27"),
      updatedAt: iso("2026-05-13"),
    },
    {
      id: "imk-09",
      title: "아이마켓 자체 완속 모델(IMK-EV7) 개발",
      status: "done",
      priority: "normal",
      category: "tech_support",
      phase: 3,
      projectId: "biz-imk",
      assigneeOrPartner: "아이마켓코리아",
      chargerModel: "IMK-EV7",
      description: "완속 모델(IMK-EV7) 연동 펌웨어 개발.",
      memo: "5/22까지 완속 모델 개발 완료 목표.",
      createdAt: iso("2026-05-01"),
      updatedAt: iso("2026-05-22"),
      completedAt: iso("2026-05-22"),
    },
    {
      id: "imk-10",
      title: "완속 모델 서버 연동 테스트 (GS차지비 검증)",
      status: "in_progress",
      priority: "high",
      category: "tech_support",
      phase: 4,
      projectId: "biz-imk",
      chargerModel: "IMK-EV7",
      description: "완속 모델(IMK-EV7) GS차지비 서버 연동 테스트·검증.",
      memo: "5/29까지 서버 연동 테스트 진행(GS차지비 검증).",
      startDate: "2026-05-23",
      dueDate: "2026-05-29",
      createdAt: iso("2026-05-18"),
      updatedAt: iso("2026-05-18"),
    },
    {
      id: "imk-11",
      title: "아이마켓코리아 향 프록시 연동 테스트",
      status: "new",
      priority: "high",
      category: "tech_support",
      phase: 4,
      projectId: "biz-imk",
      description: "아이마켓코리아 향 프록시 연동 테스트 작업.",
      memo: "6/1~6/10 진행 예정.",
      startDate: "2026-06-01",
      dueDate: "2026-06-10",
      createdAt: iso("2026-05-18"),
      updatedAt: iso("2026-05-18"),
    },
    {
      id: "imk-12",
      title: "현장 충전기 프록시 서버 전환 & GS차지비 프록시 연동 개발",
      status: "new",
      priority: "normal",
      category: "tech_support",
      phase: 5,
      projectId: "biz-imk",
      description:
        "현장 충전기 프록시 서버 전환(아이마켓 주소) 시작. GS차지비 프록시 연동 개발 병행.",
      memo: "6/10~ 진행 예정.",
      startDate: "2026-06-10",
      createdAt: iso("2026-05-18"),
      updatedAt: iso("2026-05-18"),
    },
    {
      id: "imk-13",
      title: "GS차지비 프록시 연동 테스트 완료",
      status: "new",
      priority: "normal",
      category: "tech_support",
      phase: 4,
      projectId: "biz-imk",
      description: "GS차지비 프록시 연동 테스트 완료.",
      memo: "6/30까지 완료 목표.",
      dueDate: "2026-06-30",
      createdAt: iso("2026-05-18"),
      updatedAt: iso("2026-05-18"),
    },
    {
      id: "imk-14",
      title: "이관 동의 현장 대상 GS차지비 향 프록시 순차 전환",
      status: "new",
      priority: "normal",
      category: "tech_support",
      phase: 5,
      projectId: "biz-imk",
      description: "이관 동의 현장 대상 GS차지비 향 프록시 순차 전환(아이마켓→GS차지비).",
      nextAction: "6월 초 이관동의 상면 수량 확인 후 MID 관련 추가 논의",
      memo: "7월 순차 진행 예정.",
      startDate: "2026-07-01",
      createdAt: iso("2026-05-18"),
      updatedAt: iso("2026-05-18"),
    },
  ];
}

// ─── 표준 체크리스트 템플릿 (24개, 시작 전) ──────────────────────────────────

function templateTasks(): Task[] {
  const tech: Task[] = MASTER.map((m, i) => ({
    id: `tpl-${pad2(i + 1)}`,
    title: m.title,
    status: "new",
    priority: "normal",
    category: m.category,
    phase: m.phase,
    projectId: "biz-template",
    assigneeOrPartner: m.teams,
    description: m.action,
    createdAt: iso("2026-01-15"),
    updatedAt: iso("2026-01-15"),
  }));
  const biz: Task[] = MASTER_BIZ.map((m, i) => ({
    id: `tpl-b${pad2(i + 1)}`,
    title: m.title,
    status: "new",
    priority: "normal",
    category: m.category,
    phase: m.phase,
    projectId: "biz-template",
    assigneeOrPartner: m.teams,
    description: m.action,
    createdAt: iso("2026-01-15"),
    updatedAt: iso("2026-01-15"),
  }));
  return [...tech, ...biz];
}

export function getSampleTasks(): Task[] {
  const all = [...sseTasks(), ...imkTasks(), ...templateTasks()];
  // status가 done인데 completedAt이 없으면 updatedAt으로 보정(완료일 기반 집계 정합성)
  return all.map((t) =>
    t.status === "done" && !t.completedAt ? { ...t, completedAt: t.updatedAt } : t,
  );
}

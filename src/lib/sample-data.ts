import type { Project } from "@/types/project";
import type { Task } from "@/types/task";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function dateFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().split("T")[0];
}

// 양수도 "건(딜)" — 양도사별로 하나의 프로젝트로 관리한다.
export function getSampleProjects(): Project[] {
  return [
    {
      id: "deal-ssg",
      name: "신세계 I&C 양수도",
      description:
        "신세계 I&C로부터 EV 충전기 운영권 양수 — 약 7,300기 대상, 제조사별 펌웨어 전환 및 현장 이관",
      status: "in_progress",
      startDate: dateFromNow(-120),
      targetDate: dateFromNow(40),
      createdAt: daysFromNow(-120),
      updatedAt: daysFromNow(-2),
    },
    {
      id: "deal-imk",
      name: "IMK 양수도",
      description:
        "아이마켓코리아(IMK) CPO 충전 인프라 양수 — 프록시 서버 경유 GS차지비 서버 전환",
      status: "in_progress",
      startDate: dateFromNow(-90),
      targetDate: dateFromNow(30),
      createdAt: daysFromNow(-90),
      updatedAt: daysFromNow(-1),
    },
  ];
}

// 체크리스트 항목(샘플) — 실제 데이터는 다음 단계에서 reference/ 자료로 구축한다.
export function getSampleTasks(): Task[] {
  return [
    {
      id: "chk-001",
      title: "충전기 자산 목록 실사 및 모델 인벤토리 확정",
      description: "양수 대상 충전기 수량·모델·시리얼 실사, 기존 자산대장과 대사",
      status: "done",
      priority: "high",
      category: "asset_mgmt",
      projectId: "deal-ssg",
      assigneeOrPartner: "구매자산관리팀",
      createdAt: daysFromNow(-110),
      updatedAt: daysFromNow(-80),
      completedAt: daysFromNow(-80),
    },
    {
      id: "chk-002",
      title: "제조사별 펌웨어 전환 개발 일정 수립",
      description: "LG·Signet·EVA·Humax 등 모델별 전환 개발 범위 및 일정 협의",
      status: "in_progress",
      priority: "high",
      category: "tech_integration",
      projectId: "deal-ssg",
      assigneeOrPartner: "충전기술지원팀",
      nextAction: "모델별 개발 견적·일정 회신 취합",
      dueDate: dateFromNow(5),
      createdAt: daysFromNow(-60),
      updatedAt: daysFromNow(-3),
    },
    {
      id: "chk-003",
      title: "Signet 급속충전기 485 컨넥터 수급 지연 대응",
      description: "현장 업데이트용 485 컨넥터 수급 지연 — 전환 일정 영향 검토",
      status: "delayed",
      priority: "urgent",
      category: "tech_integration",
      projectId: "deal-ssg",
      chargerModel: "SC7K-F-WT-G2",
      assigneeOrPartner: "충전기술지원팀",
      nextAction: "대체 수급처 확보 및 현장 방문 일정 재수립",
      dueDate: dateFromNow(-3),
      createdAt: daysFromNow(-40),
      updatedAt: daysFromNow(-1),
    },
    {
      id: "chk-004",
      title: "부지계약 승계 동의서 취합",
      description: "전환 대상 사이트 부지계약 승계 동의(상면동의) 취합 및 미동의 사이트 정리",
      status: "in_progress",
      priority: "normal",
      category: "contract",
      projectId: "deal-ssg",
      assigneeOrPartner: "네트워크구축관리팀",
      followUpDate: dateFromNow(3),
      createdAt: daysFromNow(-50),
      updatedAt: daysFromNow(-4),
    },
    {
      id: "chk-005",
      title: "환경공단 보조금 사업권 승인 신청",
      description: "보조금 설치 충전기 운영주체 변경 승인 신청 — 환경공단 회신 대기",
      status: "waiting",
      priority: "high",
      category: "license",
      projectId: "deal-ssg",
      assigneeOrPartner: "한국환경공단",
      nextAction: "승인 지연 시 담당자 유선 확인",
      requestedAt: daysFromNow(-10),
      followUpDate: dateFromNow(1),
      createdAt: daysFromNow(-15),
      updatedAt: daysFromNow(-10),
    },
    {
      id: "chk-006",
      title: "PG(헥토파이낸셜) MID 매핑 및 결제 연동 검증",
      description: "기존 가맹점 MID를 매장 ID에 매핑하고 카드 결제·취소 정상 동작 검증",
      status: "in_progress",
      priority: "normal",
      category: "settlement",
      projectId: "deal-imk",
      assigneeOrPartner: "재무팀 / 헥토파이낸셜",
      nextAction: "결제·취소 스크립트로 샘플 거래 검증",
      dueDate: dateFromNow(6),
      createdAt: daysFromNow(-20),
      updatedAt: daysFromNow(-2),
    },
    {
      id: "chk-007",
      title: "IMK 프록시 서버 전환 테스트",
      description: "충전기 → 프록시 경유 → GS차지비 서버 리다이렉트 연동 테스트(OCPP 1.6)",
      status: "new",
      priority: "normal",
      category: "tech_integration",
      projectId: "deal-imk",
      chargerModel: "IMK-EV7",
      nextAction: "프록시 테스트 환경 구성 및 1차 시나리오 실행",
      dueDate: dateFromNow(8),
      createdAt: daysFromNow(-6),
      updatedAt: daysFromNow(-6),
    },
    {
      id: "chk-008",
      title: "콜센터·유지보수 이관 협의",
      description: "콜센터 응대 및 유지보수(엠비즈) 책임 이관 범위·시점 협의",
      status: "hold",
      priority: "low",
      category: "operation",
      projectId: "deal-ssg",
      assigneeOrPartner: "고객경험팀",
      memo: "전환 실행 일정 확정 후 재개",
      createdAt: daysFromNow(-30),
      updatedAt: daysFromNow(-12),
    },
    {
      id: "chk-009",
      title: "전환 대상 충전기 스티커 부착 및 원격 업데이트",
      description: "1차 전환 대상(90개소 670기) 원격 펌웨어 업데이트 및 안내 스티커 부착",
      status: "monitoring",
      priority: "high",
      category: "operation",
      projectId: "deal-ssg",
      assigneeOrPartner: "충전기술지원팀",
      nextAction: "업데이트 성공률 모니터링 및 실패분 현장 조치",
      startDate: dateFromNow(-2),
      dueDate: dateFromNow(10),
      createdAt: daysFromNow(-10),
      updatedAt: daysFromNow(0),
    },
    {
      id: "chk-010",
      title: "신세계 측 이관동의 협조 요청 회신 확인",
      description: "이관동의 협조도 개선을 위한 협조 요청 메일 발송 — 회신 대기",
      status: "waiting",
      priority: "normal",
      category: "communication",
      projectId: "deal-ssg",
      assigneeOrPartner: "신세계 I&C",
      nextAction: "회신 없을 경우 담당자 미팅 요청",
      requestedAt: daysFromNow(-4),
      followUpDate: dateFromNow(2),
      createdAt: daysFromNow(-4),
      updatedAt: daysFromNow(-4),
    },
  ];
}

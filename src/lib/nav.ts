import {
  LayoutDashboard,
  ListChecks,
  KanbanSquare,
  CalendarDays,
  FolderKanban,
  Inbox,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/types/nav";

export const navItems: NavItem[] = [
  {
    title: "대시보드",
    href: "/",
    icon: LayoutDashboard,
    description: "양수도 진행 현황과 주요 지표",
  },
  {
    title: "체크리스트",
    href: "/tasks",
    icon: ListChecks,
    description: "양수도 체크리스트 항목 전체 관리",
  },
  {
    title: "진행 보드",
    href: "/board",
    icon: KanbanSquare,
    description: "상태별 진행 흐름을 한눈에",
  },
  {
    title: "일정",
    href: "/calendar",
    icon: CalendarDays,
    description: "마감·전환 일정 캘린더 뷰",
  },
  {
    title: "양수도 건",
    href: "/projects",
    icon: FolderKanban,
    description: "양수도 건(딜)별 진행 상황",
  },
  {
    title: "회신 대기",
    href: "/waiting",
    icon: Inbox,
    description: "제조사·상대사 회신 대기 항목",
  },
  {
    title: "설정",
    href: "/settings",
    icon: Settings,
    description: "데이터 백업 및 환경 설정",
  },
];

export function getNavItemByPath(pathname: string): NavItem | undefined {
  if (pathname === "/") {
    return navItems[0];
  }
  return navItems.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href),
  );
}

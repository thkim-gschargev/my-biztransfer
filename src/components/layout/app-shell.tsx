"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AuthProvider } from "@/providers/auth-provider";
import { TasksProvider } from "@/providers/tasks-provider";
import { ProjectsProvider } from "@/providers/projects-provider";
import { ActivityLogsProvider } from "@/providers/activity-logs-provider";
import { CategoriesProvider } from "@/providers/categories-provider";
import { CurrentDealProvider } from "@/providers/current-deal-provider";
import { useProjects } from "@/hooks/use-projects";
import { useCurrentDeal } from "@/hooks/use-current-deal";
import { LocalMirror } from "@/components/local-mirror";

interface AppShellProps {
  children: ReactNode;
}

// Provider 중첩 순서가 중요합니다:
// AuthProvider 가 userId 를 제공하고, TasksProvider 는 활동 로그 기록을 위해
// ActivityLogsProvider 안쪽에 위치해야 합니다.
export function AppShell({ children }: AppShellProps) {
  return (
    <AuthProvider>
      <ProjectsProvider>
        <ActivityLogsProvider>
          <TasksProvider>
            <CategoriesProvider>
              <CurrentDealProvider>
                <LocalMirror />
                <ShellBody>{children}</ShellBody>
              </CurrentDealProvider>
            </CategoriesProvider>
          </TasksProvider>
        </ActivityLogsProvider>
      </ProjectsProvider>
    </AuthProvider>
  );
}

// 양수도 건(딜) 선택 게이트 + 레이아웃 분기.
// - /select: 사이드바 없는 전체화면 선택 화면
// - 딜 미선택: /select 로 리다이렉트
// - 딜 선택됨: 일반 셸(사이드바 + 헤더)
function ShellBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dealId, ready, setDeal } = useCurrentDeal();
  const { projects, loading } = useProjects();

  // 선택된 딜이 삭제/부재하면 초기화
  useEffect(() => {
    if (ready && dealId && !loading && !projects.some((p) => p.id === dealId)) {
      setDeal(null);
    }
  }, [ready, dealId, loading, projects, setDeal]);

  // 딜 미선택 시: 딜이 정확히 1개면 자동 선택, 아니면 선택 화면으로.
  // 단 /select(선택 화면)와 /settings(온보딩용 데이터 불러오기)는 예외.
  useEffect(() => {
    if (!ready || dealId || loading) return;
    if (projects.length === 1 && pathname !== "/select") {
      setDeal(projects[0].id);
      return;
    }
    if (pathname !== "/select" && pathname !== "/settings") {
      router.replace("/select");
    }
  }, [ready, dealId, loading, projects, pathname, router, setDeal]);

  // 선택 화면은 전체화면(셸 크롬 없이)
  if (pathname === "/select") {
    return <div className="bg-app min-h-screen w-full">{children}</div>;
  }

  const shell = (
    <div className="bg-app flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );

  // 딜이 없어도 /settings 는 접근 허용(온보딩: 관리자가 샘플 데이터를 불러올 수 있어야 함)
  if (ready && !dealId && pathname === "/settings") {
    return shell;
  }

  // 초기 로드 중이거나 딜 미선택 → 리다이렉트/자동선택 대기(빈 화면 깜빡임 방지)
  if (!ready || !dealId) {
    return (
      <div className="bg-app flex min-h-screen w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      </div>
    );
  }

  return shell;
}

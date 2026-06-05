"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AuthProvider } from "@/providers/auth-provider";
import { TasksProvider } from "@/providers/tasks-provider";
import { ProjectsProvider } from "@/providers/projects-provider";
import { ActivityLogsProvider } from "@/providers/activity-logs-provider";
import { CategoriesProvider } from "@/providers/categories-provider";
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
              <LocalMirror />
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
            </CategoriesProvider>
          </TasksProvider>
        </ActivityLogsProvider>
      </ProjectsProvider>
    </AuthProvider>
  );
}

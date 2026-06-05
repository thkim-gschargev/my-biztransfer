"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuthPage) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}

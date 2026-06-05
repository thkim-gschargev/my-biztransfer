"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-sidebar-primary-foreground shadow-sm">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">양수도 사업 관제판</span>
          <span className="text-[11px] text-muted-foreground">EV 충전기 운영권 양수도</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80",
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-5 py-3 text-[11px] text-muted-foreground">
        Supabase 클라우드 동기화
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="네비게이션 열기"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="h-16 flex-row items-center gap-2 border-b px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ClipboardList className="h-5 w-5" />
          </span>
          <SheetTitle className="text-sm font-semibold">
            양수도 사업 관제판
          </SheetTitle>
        </SheetHeader>
        <nav className="px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "hover:bg-sidebar-accent/60",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

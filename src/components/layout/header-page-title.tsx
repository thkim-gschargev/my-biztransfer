"use client";

import { usePathname } from "next/navigation";
import { getNavItemByPath } from "@/lib/nav";

export function HeaderPageTitle() {
  const pathname = usePathname();
  const current = getNavItemByPath(pathname);

  return (
    <div className="flex min-w-0 flex-col">
      <h1 className="truncate text-base font-semibold leading-none">
        {current?.title ?? "양수도 사업 관제판"}
      </h1>
      {current?.description ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {current.description}
        </p>
      ) : null}
    </div>
  );
}

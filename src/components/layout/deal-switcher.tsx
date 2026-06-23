"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, CheckIcon, LayoutGridIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjects } from "@/hooks/use-projects";
import { useCurrentDeal } from "@/hooks/use-current-deal";

export function DealSwitcher() {
  const { projects } = useProjects();
  const { dealId, setDeal } = useCurrentDeal();
  const router = useRouter();

  const current = projects.find((p) => p.id === dealId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex max-w-[180px] items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent sm:max-w-[240px]">
        <span className="truncate">{current?.name ?? "양수도 건 선택"}</span>
        <ChevronsUpDownIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {projects.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setDeal(p.id)}
            className="flex items-center gap-2"
          >
            <CheckIcon
              className={`h-3.5 w-3.5 shrink-0 ${p.id === dealId ? "opacity-100 text-primary" : "opacity-0"}`}
            />
            <span className="truncate">{p.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/select")} className="flex items-center gap-2">
          <LayoutGridIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          양수도 건 선택 화면
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

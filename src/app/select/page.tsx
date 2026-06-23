"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, PlusIcon, ArrowRightIcon } from "lucide-react";
import {
  useProjects,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useCurrentDeal } from "@/hooks/use-current-deal";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_CLASSES } from "@/lib/constants";

export default function SelectDealPage() {
  const { projects, addProject } = useProjects();
  const { tasks } = useTasks();
  const { setDeal } = useCurrentDeal();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  function choose(id: string) {
    setDeal(id);
    router.push("/");
  }

  function handleCreate(input: CreateProjectInput | UpdateProjectInput) {
    const project = addProject(input as CreateProjectInput);
    setDeal(project.id);
    router.push("/");
  }

  function progressOf(projectId: string) {
    const own = tasks.filter((t) => t.projectId === projectId && t.status !== "cancelled");
    const done = own.filter((t) => t.status === "done").length;
    return { total: own.length, done, rate: own.length ? Math.round((done / own.length) * 100) : 0 };
  }

  return (
    <div className="bg-app flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-3xl flex-col gap-8 py-10">
        {/* 헤더 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-md">
            <ClipboardList className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold">양수도 사업 관제판</h1>
          <p className="text-sm text-muted-foreground">
            작업할 양수도 건을 선택하세요.
          </p>
        </div>

        {/* 딜 카드 그리드 */}
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => {
            const s = progressOf(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => choose(p.id)}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-elevated"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold leading-snug">{p.name}</span>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                {p.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <Badge variant="outline" className={`text-[11px] ${PROJECT_STATUS_CLASSES[p.status]}`}>
                    {PROJECT_STATUS_LABELS[p.status]}
                  </Badge>
                  {s.total > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {s.done}/{s.total} ({s.rate}%)
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* 신규 생성 카드 */}
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/40 p-4 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <PlusIcon className="h-6 w-6" />
            <span className="text-sm font-medium">신규 양수도 건 생성</span>
          </button>
        </div>

        {projects.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            아직 등록된 양수도 건이 없습니다. 신규로 생성하거나, 설정에서 체크리스트 데이터를 불러오세요.
          </p>
        )}
      </div>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}

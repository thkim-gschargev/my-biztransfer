"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { useProjects, type CreateProjectInput, type UpdateProjectInput } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useCurrentDeal } from "@/hooks/use-current-deal";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageTitle } from "@/components/common/page-title";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { tasks } = useTasks();
  const { setDeal } = useCurrentDeal();
  const router = useRouter();

  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [projectDeleteOpen, setProjectDeleteOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | undefined>(undefined);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const editProject = editProjectId
    ? projects.find((p) => p.id === editProjectId)
    : undefined;
  const projectToDelete = deleteProjectId
    ? (projects.find((p) => p.id === deleteProjectId) ?? null)
    : null;

  function openProjectAdd() {
    setEditProjectId(undefined);
    setProjectFormOpen(true);
  }

  function openProjectEdit(project: Project) {
    setEditProjectId(project.id);
    setProjectFormOpen(true);
  }

  function openProjectDelete(project: Project) {
    setDeleteProjectId(project.id);
    setProjectDeleteOpen(true);
  }

  // 카드 클릭 → 해당 양수도 건으로 진입(현재 딜 설정 후 대시보드로). /select 와 동일한 동작.
  function enterDeal(project: Project) {
    setDeal(project.id);
    router.push("/");
  }

  function handleProjectSubmit(input: CreateProjectInput | UpdateProjectInput) {
    if (editProjectId) {
      updateProject(editProjectId, input as UpdateProjectInput);
    } else {
      addProject(input as CreateProjectInput);
    }
    setEditProjectId(undefined);
  }

  function handleProjectDelete() {
    if (deleteProjectId) {
      deleteProject(deleteProjectId);
      setDeleteProjectId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="양수도 건"
        description="양수도 건별 진행 상황을 관리합니다. 카드를 클릭하면 해당 건으로 진입합니다."
      >
        <Button size="sm" onClick={openProjectAdd}>
          <PlusIcon className="h-4 w-4" />
          양수도 건 추가
        </Button>
      </PageTitle>

      {projects.length === 0 ? (
        <EmptyState
          title="양수도 건이 없습니다"
          description="새 양수도 건을 추가해보세요."
        >
          <Button size="sm" onClick={openProjectAdd}>
            양수도 건 추가
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={tasks}
              onEdit={openProjectEdit}
              onDelete={openProjectDelete}
              onClick={enterDeal}
            />
          ))}
        </div>
      )}

      {/* 양수도 건 추가/수정 */}
      <ProjectFormDialog
        open={projectFormOpen}
        onOpenChange={(o) => {
          setProjectFormOpen(o);
          if (!o) setEditProjectId(undefined);
        }}
        project={editProject}
        onSubmit={handleProjectSubmit}
      />

      {/* 양수도 건 삭제 확인 */}
      <ConfirmDialog
        open={projectDeleteOpen}
        onOpenChange={setProjectDeleteOpen}
        title="양수도 건 삭제"
        description={`"${projectToDelete?.name ?? ""}"을(를) 삭제하시겠습니까? 연결된 체크리스트 항목에서 양수도 건 정보가 제거됩니다.`}
        onConfirm={handleProjectDelete}
      />
    </div>
  );
}

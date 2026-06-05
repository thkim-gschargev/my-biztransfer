"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { useProjects, type CreateProjectInput, type UpdateProjectInput } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskDialogs } from "@/hooks/use-task-dialogs";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectTasksDialog } from "@/components/projects/project-tasks-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageTitle } from "@/components/common/page-title";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { tasks } = useTasks();
  const { activityLogs } = useActivityLogs();
  const {
    formOpen: taskFormOpen, setFormOpen: setTaskFormOpen,
    detailOpen: taskDetailOpen, setDetailOpen: setTaskDetailOpen,
    deleteOpen: taskDeleteOpen, setDeleteOpen: setTaskDeleteOpen,
    setEditTaskId,
    selectedTaskId,
    editTask, selectedTask,
    openEdit: openTaskEdit,
    openDetail: openTaskDetail,
    openDelete: openTaskDelete,
    handleEditOnlySubmit: handleTaskSubmit,
    handleDelete: handleTaskDelete,
    handleStatusChange: handleTaskStatusChange,
    handleComplete: handleTaskComplete,
    handleDuplicate: handleTaskDuplicate,
  } = useTaskDialogs(tasks);

  // ─── 프로젝트 다이얼로그 state ─────────────────────────────────────────────
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [projectDeleteOpen, setProjectDeleteOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | undefined>(undefined);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  // ─── 프로젝트 업무 목록 state ──────────────────────────────────────────────
  const [projectTasksOpen, setProjectTasksOpen] = useState(false);
  const [viewProjectId, setViewProjectId] = useState<string | null>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const editProject = editProjectId
    ? projects.find((p) => p.id === editProjectId)
    : undefined;
  const projectToDelete = deleteProjectId
    ? (projects.find((p) => p.id === deleteProjectId) ?? null)
    : null;
  const viewProject = viewProjectId
    ? (projects.find((p) => p.id === viewProjectId) ?? null)
    : null;
  const selectedTaskProject = selectedTask?.projectId
    ? projects.find((p) => p.id === selectedTask.projectId)
    : undefined;

  // ─── 프로젝트 핸들러 ───────────────────────────────────────────────────────
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

  function openProjectTasks(project: Project) {
    setViewProjectId(project.id);
    setProjectTasksOpen(true);
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
        title="프로젝트"
        description="프로젝트별 진행 상황과 관련 업무를 관리합니다."
      >
        <Button size="sm" onClick={openProjectAdd}>
          <PlusIcon className="h-4 w-4" />
          프로젝트 추가
        </Button>
      </PageTitle>

      {projects.length === 0 ? (
        <EmptyState
          title="프로젝트가 없습니다"
          description="새 프로젝트를 추가해보세요."
        >
          <Button size="sm" onClick={openProjectAdd}>
            프로젝트 추가
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
              onClick={openProjectTasks}
            />
          ))}
        </div>
      )}

      {/* 프로젝트 업무 목록 */}
      <ProjectTasksDialog
        open={projectTasksOpen}
        onOpenChange={(o) => {
          setProjectTasksOpen(o);
          if (!o) setViewProjectId(null);
        }}
        project={viewProject}
        tasks={tasks}
        onTaskClick={openTaskDetail}
      />

      {/* 업무 상세 */}
      <TaskDetailDialog
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        task={selectedTask}
        project={selectedTaskProject}
        activityLogs={activityLogs}
        onEdit={() => selectedTask && openTaskEdit(selectedTask)}
        onDelete={() => selectedTask && openTaskDelete(selectedTask)}
        onStatusChange={(status) => {
          if (selectedTaskId) handleTaskStatusChange(selectedTaskId, status);
        }}
        onComplete={() => {
          if (selectedTaskId) {
            handleTaskComplete(selectedTaskId);
            setTaskDetailOpen(false);
          }
        }}
        onDuplicate={handleTaskDuplicate}
      />

      {/* 업무 편집 */}
      <TaskFormDialog
        open={taskFormOpen}
        onOpenChange={(o) => {
          setTaskFormOpen(o);
          if (!o) setEditTaskId(undefined);
        }}
        task={editTask}
        projects={projects}
        onSubmit={handleTaskSubmit}
      />

      {/* 프로젝트 추가/수정 */}
      <ProjectFormDialog
        open={projectFormOpen}
        onOpenChange={(o) => {
          setProjectFormOpen(o);
          if (!o) setEditProjectId(undefined);
        }}
        project={editProject}
        onSubmit={handleProjectSubmit}
      />

      {/* 프로젝트 삭제 확인 */}
      <ConfirmDialog
        open={projectDeleteOpen}
        onOpenChange={setProjectDeleteOpen}
        title="프로젝트 삭제"
        description={`"${projectToDelete?.name ?? ""}"을(를) 삭제하시겠습니까? 연결된 업무에서 프로젝트 정보가 제거됩니다.`}
        onConfirm={handleProjectDelete}
      />

      {/* 업무 삭제 확인 */}
      <ConfirmDialog
        open={taskDeleteOpen}
        onOpenChange={setTaskDeleteOpen}
        title="업무 삭제"
        description={`"${selectedTask?.title ?? ""}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleTaskDelete}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { useTasks, type CreateTaskInput } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";

export function QuickAddButton() {
  const [open, setOpen] = useState(false);
  const { addTask } = useTasks();
  const { projects } = useProjects();

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
        aria-label="빠른 업무 추가"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">빠른 추가</span>
      </Button>
      <TaskFormDialog
        open={open}
        onOpenChange={setOpen}
        projects={projects}
        onSubmit={(input) => addTask(input as CreateTaskInput)}
      />
    </>
  );
}

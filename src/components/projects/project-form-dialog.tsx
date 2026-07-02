"use client";

import { useState, type FormEvent } from "react";
import type { Project, ProjectStatus } from "@/types/project";
import type { CreateProjectInput, UpdateProjectInput } from "@/hooks/use-projects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUS_OPTIONS, PROJECT_STATUS_LABELS } from "@/lib/constants";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSubmit: (input: CreateProjectInput | UpdateProjectInput) => void;
}

interface ProjectFormBodyProps {
  project?: Project;
  onSubmit: (input: CreateProjectInput | UpdateProjectInput) => void;
  onClose: () => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
    </div>
  );
}

function ProjectFormBody({ project, onSubmit, onClose }: ProjectFormBodyProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "planned",
  );
  const [description, setDescription] = useState(project?.description ?? "");
  const [startDate, setStartDate] = useState(project?.startDate ?? "");
  const [targetDate, setTargetDate] = useState(project?.targetDate ?? "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      status,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(startDate ? { startDate } : {}),
      ...(targetDate ? { targetDate } : {}),
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <Field label="양수도 건 이름 *">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 신세계 I&C 양수도"
            required
          />
        </Field>

        <Field label="상태">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ProjectStatus)}
            items={PROJECT_STATUS_LABELS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="시작일">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="목표 완료일">
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="설명">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="양수도 건 설명"
            rows={3}
          />
        </Field>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          취소
        </DialogClose>
        <Button type="submit" disabled={!name.trim()}>
          {project ? "저장" : "추가"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {project ? "양수도 건 수정" : "양수도 건 추가"}
          </DialogTitle>
        </DialogHeader>
        <ProjectFormBody
          key={open ? (project?.id ?? "new") : "closed"}
          project={project}
          onSubmit={onSubmit}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

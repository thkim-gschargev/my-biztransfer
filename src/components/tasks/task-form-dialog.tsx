"use client";

import { useState, type FormEvent } from "react";
import type { Task, TaskStatus, TaskPriority, TaskPhase } from "@/types/task";
import type { Project } from "@/types/project";
import type { CreateTaskInput, UpdateTaskInput } from "@/hooks/use-tasks";
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
import { Separator } from "@/components/ui/separator";
import {
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  PHASE_LABELS,
  PHASE_OPTIONS,
} from "@/lib/constants";
import { useCategories } from "@/hooks/use-categories";

const PHASE_SELECT_ITEMS: Record<string, string> = {
  __none__: "미지정",
  ...Object.fromEntries(PHASE_OPTIONS.map((o) => [String(o.value), o.label])),
};

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  projects: Project[];
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => void;
  defaultDueDate?: string;
}

interface TaskFormBodyProps {
  task?: Task;
  projects: Project[];
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => void;
  onClose: () => void;
  defaultDueDate?: string;
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

function TaskFormBody({ task, projects, onSubmit, onClose, defaultDueDate }: TaskFormBodyProps) {
  const { categories, getCategoryLabel } = useCategories();
  const categoryItems = Object.fromEntries(categories.map((c) => [c.value, c.label]));

  const projectItems = {
    __none__: "없음",
    ...Object.fromEntries(projects.map((p) => [p.id, p.name])),
  };

  const [title, setTitle] = useState(task?.title ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "new");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "normal",
  );
  const [category, setCategory] = useState<string>(
    task?.category ?? "etc",
  );
  const [phase, setPhase] = useState<TaskPhase | undefined>(task?.phase);
  const [projectId, setProjectId] = useState(task?.projectId ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [nextAction, setNextAction] = useState(task?.nextAction ?? "");
  const [assigneeOrPartner, setAssigneeOrPartner] = useState(
    task?.assigneeOrPartner ?? "",
  );
  const [chargerModel, setChargerModel] = useState(task?.chargerModel ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate ?? "");
  const [startDate, setStartDate] = useState(task?.startDate ?? "");
  const [requestedAt, setRequestedAt] = useState(
    task?.requestedAt ? task.requestedAt.substring(0, 10) : "",
  );
  const [followUpDate, setFollowUpDate] = useState(task?.followUpDate ?? "");
  const [relatedLink, setRelatedLink] = useState(task?.relatedLink ?? "");
  const [memo, setMemo] = useState(task?.memo ?? "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      status,
      priority,
      category,
      phase,
      projectId: projectId || undefined,
      description: description.trim() || undefined,
      nextAction: nextAction.trim() || undefined,
      assigneeOrPartner: assigneeOrPartner.trim() || undefined,
      chargerModel: chargerModel.trim() || undefined,
      dueDate: dueDate || undefined,
      startDate: startDate || undefined,
      requestedAt: requestedAt ? new Date(requestedAt).toISOString() : undefined,
      followUpDate: followUpDate || undefined,
      relatedLink: relatedLink.trim() || undefined,
      memo: memo.trim() || undefined,
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <div className="flex flex-col gap-4 pb-1">
          <Field label="제목 *">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="업무 제목을 입력하세요"
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="상태">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
                items={TASK_STATUS_LABELS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="우선순위">
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
                items={TASK_PRIORITY_LABELS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="담당팀">
              <Select
                value={category}
                onValueChange={(v) => { if (v) setCategory(v); }}
                items={categoryItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={getCategoryLabel(category)} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="양수도 건">
              <Select
                value={projectId || "__none__"}
                onValueChange={(v) =>
                  setProjectId(v === "__none__" ? "" : (v ?? ""))
                }
                items={projectItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">없음</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="단계 (Phase)">
              <Select
                value={phase ? String(phase) : "__none__"}
                onValueChange={(v) =>
                  setPhase(!v || v === "__none__" ? undefined : (Number(v) as TaskPhase))
                }
                items={PHASE_SELECT_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">미지정</SelectItem>
                  {PHASE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {PHASE_LABELS[opt.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="담당자 / 협력사">
              <Input
                value={assigneeOrPartner}
                onChange={(e) => setAssigneeOrPartner(e.target.value)}
                placeholder="제조사, PG사, 담당자명"
              />
            </Field>
          </div>

          <Field label="충전기 모델">
            <Input
              value={chargerModel}
              onChange={(e) => setChargerModel(e.target.value)}
              placeholder="EVD100DK-PK, IMK-EV7 등"
            />
          </Field>

          <Separator />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="시작일">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="마감일">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="요청일 (회신 대기)">
              <Input
                type="date"
                value={requestedAt}
                onChange={(e) => setRequestedAt(e.target.value)}
              />
            </Field>
            <Field label="팔로업 예정일">
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </Field>
          </div>

          <Separator />

          <Field label="업무 설명">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="업무 상세 내용"
              rows={2}
            />
          </Field>
          <Field label="다음 액션">
            <Input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="다음에 할 일을 간략히"
            />
          </Field>
          <Field label="관련 링크">
            <Input
              value={relatedLink}
              onChange={(e) => setRelatedLink(e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="메모">
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="기타 참고 메모"
              rows={2}
            />
          </Field>
        </div>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          취소
        </DialogClose>
        <Button type="submit" disabled={!title.trim()}>
          {task ? "저장" : "추가"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  projects,
  onSubmit,
  defaultDueDate,
}: TaskFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{task ? "업무 수정" : "업무 추가"}</DialogTitle>
        </DialogHeader>
        <TaskFormBody
          key={open ? (task?.id ?? `new-${defaultDueDate ?? ""}`) : "closed"}
          task={task}
          projects={projects}
          onSubmit={onSubmit}
          onClose={() => onOpenChange(false)}
          defaultDueDate={defaultDueDate}
        />
      </DialogContent>
    </Dialog>
  );
}

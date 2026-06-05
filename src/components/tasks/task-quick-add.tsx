"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import type { TaskPriority } from "@/types/task";
import type { CreateTaskInput } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITY_OPTIONS, TASK_PRIORITY_LABELS } from "@/lib/constants";

interface TaskQuickAddProps {
  onSubmit: (input: CreateTaskInput) => void;
}

export function TaskQuickAdd({ onSubmit }: TaskQuickAddProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [nextAction, setNextAction] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      priority,
      status: "new",
      category: "etc",
      ...(dueDate ? { dueDate } : {}),
      ...(nextAction.trim() ? { nextAction: nextAction.trim() } : {}),
    });
    setTitle("");
    setPriority("normal");
    setDueDate("");
    setNextAction("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/20 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <div className="w-full sm:flex-1 sm:min-w-[200px]">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="빠른 업무 추가 — 제목을 입력하세요..."
          className="bg-background h-8 text-sm"
        />
      </div>
      <div className="flex gap-2 sm:contents">
        <div className="flex-1 sm:w-[110px] sm:flex-none">
          <Select
            value={priority}
            onValueChange={(v) => {
              if (v) setPriority(v as TaskPriority);
            }}
            items={TASK_PRIORITY_LABELS}
          >
            <SelectTrigger className="bg-background h-8 text-sm w-full">
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
        </div>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 sm:w-[140px] sm:flex-none bg-background h-8 text-sm"
          aria-label="마감일"
        />
      </div>
      <div className="flex gap-2 sm:contents">
        <div className="flex-1 sm:flex-1 sm:min-w-[140px]">
          <Input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="다음 액션..."
            className="bg-background h-8 text-sm"
          />
        </div>
        <Button type="submit" size="sm" disabled={!title.trim()} className="h-8 shrink-0">
          <PlusIcon className="h-3.5 w-3.5" />
          추가
        </Button>
      </div>
    </form>
  );
}

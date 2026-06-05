"use client";

import { useState } from "react";
import type { Task, TaskStatus } from "@/types/task";
import {
  useTasks,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/hooks/use-tasks";

export function useTaskDialogs(tasks: Task[]) {
  const {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    completeTask,
    duplicateTask,
  } = useTasks();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | undefined>(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const editTask = editTaskId ? tasks.find((t) => t.id === editTaskId) : undefined;
  const selectedTask = selectedTaskId
    ? (tasks.find((t) => t.id === selectedTaskId) ?? null)
    : null;

  function openAdd() {
    setEditTaskId(undefined);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditTaskId(task.id);
    setDetailOpen(false);
    setFormOpen(true);
  }

  function openDetail(task: Task) {
    setSelectedTaskId(task.id);
    setDetailOpen(true);
  }

  function openDelete(task: Task) {
    setSelectedTaskId(task.id);
    setDetailOpen(false);
    setDeleteOpen(true);
  }

  function handleSubmit(input: CreateTaskInput | UpdateTaskInput) {
    if (editTaskId) {
      updateTask(editTaskId, input as UpdateTaskInput);
    } else {
      addTask(input as CreateTaskInput);
    }
    setEditTaskId(undefined);
  }

  function handleEditOnlySubmit(input: CreateTaskInput | UpdateTaskInput) {
    if (editTaskId) {
      updateTask(editTaskId, input as UpdateTaskInput);
      setEditTaskId(undefined);
    }
  }

  function handleQuickAdd(input: CreateTaskInput) {
    addTask(input);
  }

  function handleDelete() {
    if (selectedTaskId) {
      deleteTask(selectedTaskId);
      setSelectedTaskId(null);
    }
  }

  function handleStatusChange(taskId: string, status: TaskStatus) {
    changeTaskStatus(taskId, status);
  }

  function handleComplete(taskId: string) {
    completeTask(taskId);
  }

  function handleDuplicate() {
    if (selectedTaskId) {
      duplicateTask(selectedTaskId);
      setDetailOpen(false);
    }
  }

  return {
    formOpen,
    setFormOpen,
    detailOpen,
    setDetailOpen,
    deleteOpen,
    setDeleteOpen,
    editTaskId,
    setEditTaskId,
    selectedTaskId,
    setSelectedTaskId,
    editTask,
    selectedTask,
    openAdd,
    openEdit,
    openDetail,
    openDelete,
    handleSubmit,
    handleEditOnlySubmit,
    handleQuickAdd,
    handleDelete,
    handleStatusChange,
    handleComplete,
    handleDuplicate,
  };
}

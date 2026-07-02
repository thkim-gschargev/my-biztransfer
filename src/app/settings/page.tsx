"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useCategories, type Category } from "@/hooks/use-categories";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { LOCAL_MIRROR_KEY } from "@/components/local-mirror";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { getSampleTasks, getSampleProjects } from "@/lib/sample-data";
import { taskToRow } from "@/providers/tasks-provider";
import { projectToRow } from "@/providers/projects-provider";
import { logToRow } from "@/providers/activity-logs-provider";
import type { Task } from "@/types/task";
import type { Project } from "@/types/project";
import type { ActivityLog } from "@/types/activity-log";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageTitle } from "@/components/common/page-title";
import { UserManagement } from "@/components/admin/user-management";
import {
  DownloadIcon,
  UploadIcon,
  DatabaseIcon,
  Trash2Icon,
  TagIcon,
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  HardDriveIcon,
  RotateCcwIcon,
  GripVerticalIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BackupData {
  version: 1;
  exportedAt: string;
  tasks: Task[];
  projects: Project[];
  activityLogs: ActivityLog[];
}

// 드래그로 순서를 바꿀 수 있는 카테고리 행
function SortableCategoryRow({
  cat,
  taskCount,
  isEditing,
  editingLabel,
  onEditingLabelChange,
  onCommitEdit,
  onCancelEdit,
  onEditKeyDown,
  onStartEdit,
  onDelete,
}: {
  cat: Category;
  taskCount: number;
  isEditing: boolean;
  editingLabel: string;
  onEditingLabelChange: (v: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onEditKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onStartEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.value });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 rounded-lg border bg-muted/30 px-2 py-2"
    >
      <button
        type="button"
        className="flex h-6 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="드래그하여 순서 변경"
        title="드래그하여 순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="h-4 w-4" />
      </button>
      {isEditing ? (
        <>
          <Input
            autoFocus
            value={editingLabel}
            onChange={(e) => onEditingLabelChange(e.target.value)}
            onKeyDown={onEditKeyDown}
            onBlur={onCommitEdit}
            className="h-7 flex-1 text-sm"
          />
          <button
            type="button"
            onClick={onCommitEdit}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
          >
            <CheckIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
          >
            <XIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{cat.label}</span>
          {taskCount > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {taskCount}건
            </span>
          )}
          <button
            type="button"
            onClick={() => onStartEdit(cat)}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
            title="이름 수정"
          >
            <PencilIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(cat)}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
            title="삭제"
          >
            <Trash2Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { tasks, refresh: refreshTasks } = useTasks();
  const { projects, refresh: refreshProjects } = useProjects();
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories, refresh: refreshCategories } =
    useCategories();
  const { refresh: refreshLogs } = useActivityLogs();
  const { userId } = useAuth();
  const { isAdmin, ready: adminReady } = useIsAdmin();
  // 데이터는 팀 공유이므로 파괴적 작업(불러오기/가져오기/복원/삭제)은 관리자만 실행 가능
  const canManageData = isAdmin;

  // 벌크 작업 후 전체 페이지 새로고침(window.location.reload) 대신 Provider 들을 재동기화
  async function refreshAll() {
    await Promise.all([refreshProjects(), refreshTasks(), refreshLogs(), refreshCategories()]);
  }
  const supabase = useRef(createClient()).current;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sampleConfirmOpen, setSampleConfirmOpen] = useState(false);
  const [restoreMirrorOpen, setRestoreMirrorOpen] = useState(false);
  const [mirrorInfo, setMirrorInfo] = useState<{
    exportedAt: string;
    tasks: number;
    projects: number;
    logs: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // 이 기기 자동 백업(localStorage 미러) 정보 읽기
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(LOCAL_MIRROR_KEY);
        if (!raw) return;
        const d = JSON.parse(raw) as Partial<BackupData>;
        setMirrorInfo({
          exportedAt: typeof d.exportedAt === "string" ? d.exportedAt : "",
          tasks: Array.isArray(d.tasks) ? d.tasks.length : 0,
          projects: Array.isArray(d.projects) ? d.projects.length : 0,
          logs: Array.isArray(d.activityLogs) ? d.activityLogs.length : 0,
        });
      } catch {
        // 파싱 실패 무시
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // ─── 카테고리 관리 state ──────────────────────────────────────────────────────
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);

  function startEdit(cat: Category) {
    setEditingValue(cat.value);
    setEditingLabel(cat.label);
  }

  function commitEdit() {
    if (editingValue && editingLabel.trim()) {
      updateCategory(editingValue, editingLabel.trim());
    }
    setEditingValue(null);
    setEditingLabel("");
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") { setEditingValue(null); setEditingLabel(""); }
  }

  function handleAddCategory() {
    if (!newCategoryLabel.trim()) return;
    addCategory(newCategoryLabel.trim());
    setNewCategoryLabel("");
  }

  function handleAddKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddCategory();
  }

  function getCategoryTaskCount(value: string) {
    return tasks.filter((t) => t.category === value).length;
  }

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleCategoryDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.value === active.id);
    const newIndex = categories.findIndex((c) => c.value === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    reorderCategories(arrayMove(categories, oldIndex, newIndex).map((c) => c.value));
  }

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    waiting: tasks.filter((t) => t.status === "waiting").length,
    projects: projects.length,
  };

  async function handleExport() {
    const { data: logRows } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    const activityLogs: ActivityLog[] = (logRows ?? []).map((row) => ({
      id: row.id as string,
      taskId: row.task_id as string,
      type: row.type as ActivityLog["type"],
      message: row.message as string,
      createdAt: row.created_at as string,
    }));

    const data: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
      activityLogs,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bt-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 백업 데이터(BackupData) 검증 후 기존 데이터를 덮어쓰며 복원. 파일/미러 복원이 공유.
  async function applyBackup(raw: unknown) {
    if (!raw || typeof raw !== "object") throw new Error("올바르지 않은 백업 데이터입니다.");
    const d = raw as Partial<BackupData>;
    if (d.version !== 1) throw new Error(`지원하지 않는 백업 버전: ${String(d.version)}`);
    if (!Array.isArray(d.tasks) || !Array.isArray(d.projects) || !Array.isArray(d.activityLogs)) {
      throw new Error("백업 데이터 구조가 올바르지 않습니다.");
    }
    if (!userId) throw new Error("로그인이 필요합니다.");
    await supabase.from("activity_logs").delete().not("id", "is", null);
    await supabase.from("tasks").delete().not("id", "is", null);
    await supabase.from("projects").delete().not("id", "is", null);
    // FK 의존성 순서로 삽입: projects → tasks(project_id 참조) → activity_logs(task_id 참조)
    if (d.projects.length > 0) {
      const { error } = await supabase.from("projects").insert(d.projects.map((p) => projectToRow(p, userId)));
      if (error) throw new Error(`양수도 건 복원 실패: ${error.message}`);
    }
    if (d.tasks.length > 0) {
      const { error } = await supabase.from("tasks").insert(d.tasks.map((t) => taskToRow(t, userId)));
      if (error) throw new Error(`체크리스트 항목 복원 실패: ${error.message}`);
    }
    if (d.activityLogs.length > 0) {
      const { error } = await supabase.from("activity_logs").insert(d.activityLogs.map((l) => logToRow(l, userId)));
      if (error) throw new Error(`활동 로그 복원 실패: ${error.message}`);
    }
  }

  async function handleRestoreMirror() {
    const raw = localStorage.getItem(LOCAL_MIRROR_KEY);
    if (!raw) {
      setImportError("이 기기에 저장된 자동 백업이 없습니다.");
      return;
    }
    setLoading(true);
    try {
      await applyBackup(JSON.parse(raw));
      setImportError(null);
      await refreshAll();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "복원에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data: unknown = JSON.parse(event.target?.result as string);
        setLoading(true);
        await applyBackup(data);
        setImportError(null);
        e.target.value = "";
        await refreshAll();
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "올바르지 않은 JSON 파일입니다.");
        e.target.value = "";
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setImportError("파일을 읽을 수 없습니다.");
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  async function handleLoadSample() {
    if (!userId) {
      toast.error("로그인이 필요합니다. 다시 로그인 후 시도해 주세요.");
      return;
    }
    setLoading(true);
    try {
      await supabase.from("activity_logs").delete().not("id", "is", null);
      await supabase.from("tasks").delete().not("id", "is", null);
      await supabase.from("projects").delete().not("id", "is", null);
      // 담당팀(카테고리) 기본값을 새로 시드하도록 기존 카테고리도 초기화한다.
      await supabase.from("categories").delete().eq("user_id", userId);
      try {
        localStorage.removeItem("bt_categories");
      } catch {}
      const sampleProjects = getSampleProjects();
      const sampleTasks = getSampleTasks();
      const { error: pErr } = await supabase
        .from("projects")
        .insert(sampleProjects.map((p) => projectToRow(p, userId)));
      if (pErr) throw new Error(`양수도 건 저장 실패: ${pErr.message}`);
      const { error: tErr } = await supabase
        .from("tasks")
        .insert(sampleTasks.map((t) => taskToRow(t, userId)));
      if (tErr) throw new Error(`체크리스트 항목 저장 실패: ${tErr.message}`);
      await refreshAll();
      toast.success(
        `체크리스트를 불러왔습니다. (양수도 건 ${sampleProjects.length} · 항목 ${sampleTasks.length})`,
      );
    } catch (err) {
      console.error("[handleLoadSample]", err);
      toast.error(err instanceof Error ? err.message : "데이터 불러오기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleSampleClick() {
    if (stats.total > 0 || stats.projects > 0) {
      setSampleConfirmOpen(true);
    } else {
      void handleLoadSample();
    }
  }

  async function handleClearAll() {
    if (!userId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setLoading(true);
    try {
      await supabase.from("activity_logs").delete().not("id", "is", null);
      await supabase.from("tasks").delete().not("id", "is", null);
      await supabase.from("projects").delete().not("id", "is", null);
      await refreshAll();
      toast.success("모든 데이터를 삭제했습니다.");
    } catch (err) {
      console.error("[handleClearAll]", err);
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="설정"
        description="데이터 백업, 복원, 초기화 등을 관리합니다."
      />

      {/* 팀원 계정 관리 (관리자에게만 표시) */}
      <UserManagement />

      {/* 현재 데이터 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            현재 데이터
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Supabase에 저장된 데이터 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "전체 업무", value: stats.total },
              { label: "완료 업무", value: stats.done },
              { label: "진행 중", value: stats.inProgress },
              { label: "회신 대기", value: stats.waiting },
              { label: "양수도 건", value: stats.projects },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1 text-center">
                <span className="text-2xl font-semibold tabular-nums">
                  {item.value}
                </span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* 샘플 데이터 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">체크리스트 데이터 불러오기</CardTitle>
            <CardDescription className="text-xs">
              양수도 체크리스트(신세계·IMK·표준 템플릿) 데이터를 불러옵니다. ⚠️ 팀 전체의 기존 데이터를 덮어씁니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleSampleClick} disabled={loading || !canManageData}>
              {loading ? "불러오는 중…" : "샘플 데이터 불러오기"}
            </Button>
            {adminReady && !canManageData && (
              <p className="text-xs text-muted-foreground">관리자만 실행할 수 있습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 내보내기 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" />
              JSON 내보내기
            </CardTitle>
            <CardDescription className="text-xs">
              전체 업무, 프로젝트, 활동 로그를 JSON 파일로 다운로드합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void handleExport()} disabled={loading}>
              <DownloadIcon className="h-4 w-4" />
              내보내기
            </Button>
          </CardContent>
        </Card>

        {/* 가져오기 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              JSON 가져오기
            </CardTitle>
            <CardDescription className="text-xs">
              JSON 백업 파일을 업로드하여 데이터를 복원합니다. 기존 데이터를 덮어씁니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || !canManageData}
            >
              <UploadIcon className="h-4 w-4" />
              파일 선택
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleFileChange}
            />
            {adminReady && !canManageData && (
              <p className="text-xs text-muted-foreground">관리자만 실행할 수 있습니다.</p>
            )}
            {importError && (
              <p className="text-xs text-destructive">{importError}</p>
            )}
          </CardContent>
        </Card>

        {/* 이 기기 자동 백업 복원 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDriveIcon className="h-4 w-4" />
              이 기기 자동 백업
            </CardTitle>
            <CardDescription className="text-xs">
              데이터 변경 시 이 브라우저에 자동 저장됩니다. 클라우드가 유실되어도 마지막 상태를 복원할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mirrorInfo ? (
              <p className="text-xs text-muted-foreground">
                마지막 저장: {mirrorInfo.exportedAt.replace("T", " ").slice(0, 19)}
                <br />
                업무 {mirrorInfo.tasks} · 프로젝트 {mirrorInfo.projects} · 로그 {mirrorInfo.logs}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                아직 이 기기에 저장된 자동 백업이 없습니다.
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => setRestoreMirrorOpen(true)}
              disabled={loading || !mirrorInfo || !canManageData}
            >
              <RotateCcwIcon className="h-4 w-4" />
              이 백업으로 복원
            </Button>
            {adminReady && !canManageData && (
              <p className="text-xs text-muted-foreground">관리자만 실행할 수 있습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 데이터 초기화 */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2Icon className="h-4 w-4" />
              전체 데이터 삭제
            </CardTitle>
            <CardDescription className="text-xs">
              ⚠️ 팀 전체의 모든 양수도 건·체크리스트·활동 로그를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={loading || !canManageData}>
              <Trash2Icon className="h-4 w-4" />
              전체 삭제
            </Button>
            {adminReady && !canManageData && (
              <p className="text-xs text-muted-foreground">관리자만 실행할 수 있습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 카테고리 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            담당팀 관리
          </CardTitle>
          <CardDescription className="text-xs">
            담당팀(카테고리)을 추가하거나 이름을 수정할 수 있습니다. 변경사항은 클라우드에 동기화됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* 카테고리 목록 (드래그하여 순서 변경) */}
          <DndContext
            sensors={categorySensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.value)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <SortableCategoryRow
                    key={cat.value}
                    cat={cat}
                    taskCount={getCategoryTaskCount(cat.value)}
                    isEditing={editingValue === cat.value}
                    editingLabel={editingLabel}
                    onEditingLabelChange={setEditingLabel}
                    onCommitEdit={commitEdit}
                    onCancelEdit={() => {
                      setEditingValue(null);
                      setEditingLabel("");
                    }}
                    onEditKeyDown={handleEditKeyDown}
                    onStartEdit={startEdit}
                    onDelete={setDeleteCategoryTarget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* 새 카테고리 추가 */}
          <div className="flex gap-2 pt-1">
            <Input
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="새 담당팀 이름"
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCategory}
              disabled={!newCategoryLabel.trim()}
            >
              <PlusIcon className="h-4 w-4" />
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• 데이터는 Supabase 클라우드 DB에 저장됩니다.</p>
        <p>• 계정이 삭제되면 모든 데이터가 함께 삭제됩니다.</p>
        <p>• 정기적으로 JSON 내보내기를 통해 백업해 두는 것을 권장합니다.</p>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={restoreMirrorOpen}
        onOpenChange={setRestoreMirrorOpen}
        title="이 기기 백업으로 복원"
        description="이 브라우저에 저장된 자동 백업으로 복원합니다. ⚠️ 팀 전체의 현재 데이터를 덮어씁니다. 계속하시겠습니까?"
        confirmLabel="복원"
        onConfirm={() => void handleRestoreMirror()}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="전체 데이터 삭제"
        description="⚠️ 팀 전체의 모든 양수도 건·체크리스트·활동 로그가 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?"
        confirmLabel="전체 삭제"
        onConfirm={() => void handleClearAll()}
      />
      <ConfirmDialog
        open={sampleConfirmOpen}
        onOpenChange={setSampleConfirmOpen}
        title="샘플 데이터 불러오기"
        description="⚠️ 팀 전체의 기존 데이터가 샘플 데이터로 덮어씌워집니다. 계속하시겠습니까?"
        confirmLabel="덮어쓰기"
        onConfirm={() => void handleLoadSample()}
      />
      <ConfirmDialog
        open={deleteCategoryTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteCategoryTarget(null); }}
        title="카테고리 삭제"
        description={`"${deleteCategoryTarget?.label ?? ""}" 카테고리를 삭제합니다. 이 카테고리를 사용 중인 업무(${getCategoryTaskCount(deleteCategoryTarget?.value ?? "")}건)는 카테고리가 표시되지 않을 수 있습니다.`}
        confirmLabel="삭제"
        onConfirm={() => {
          if (deleteCategoryTarget) deleteCategory(deleteCategoryTarget.value);
          setDeleteCategoryTarget(null);
        }}
      />
    </div>
  );
}

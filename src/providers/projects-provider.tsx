"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Project } from "@/types/project";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/lib/toast";

export type CreateProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;
export type UpdateProjectInput = Partial<Omit<Project, "id" | "createdAt">>;

function now(): string {
  return new Date().toISOString();
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as Project["status"],
    ...(row.description != null && { description: row.description as string }),
    ...(row.start_date != null && { startDate: (row.start_date as string).substring(0, 10) }),
    ...(row.target_date != null && { targetDate: (row.target_date as string).substring(0, 10) }),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function projectToRow(project: Project, userId: string) {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    status: project.status,
    description: project.description ?? null,
    start_date: project.startDate ?? null,
    target_date: project.targetDate ?? null,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

function inputToRow(input: UpdateProjectInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const fields: [keyof UpdateProjectInput, string][] = [
    ["name", "name"], ["status", "status"], ["description", "description"],
    ["startDate", "start_date"], ["targetDate", "target_date"],
  ];
  for (const [from, to] of fields) {
    if (from in input) row[to] = (input as Record<string, unknown>)[from] ?? null;
  }
  return row;
}

interface ProjectsContextValue {
  projects: Project[];
  loading: boolean;
  addProject: (input: CreateProjectInput) => Project;
  updateProject: (id: string, input: UpdateProjectInput) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  refresh: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { userId, loading: authLoading } = useAuth();
  const projectsRef = useRef<Project[]>([]);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    if (authLoading) return; // 인증 확인 전에는 로딩 상태 유지
    let active = true;
    if (!userId) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setProjects([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }
    void (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        console.error("[ProjectsProvider] SELECT error:", error);
        toast.error("프로젝트 목록을 불러오지 못했습니다.");
      }
      if (data) setProjects((data as Record<string, unknown>[]).map(rowToProject));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId, authLoading, supabase]);

  const addProject = useCallback(
    (input: CreateProjectInput): Project => {
      const ts = now();
      const project: Project = { ...input, id: crypto.randomUUID(), createdAt: ts, updatedAt: ts };
      setProjects((prev) => [project, ...prev]); // 낙관적 추가
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return project;
      }
      void (async () => {
        const { error } = await supabase.from("projects").insert(projectToRow(project, userId));
        if (error) {
          console.error("[ProjectsProvider] INSERT error:", error);
          setProjects((prev) => prev.filter((p) => p.id !== project.id)); // 롤백
          toast.error("프로젝트 저장에 실패했습니다.");
        }
      })();
      return project;
    },
    [supabase, userId],
  );

  const updateProject = useCallback(
    (id: string, input: UpdateProjectInput): void => {
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      const prevProject = projectsRef.current.find((p) => p.id === id);
      const ts = now();
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...input, id, updatedAt: ts } : p)),
      ); // 낙관적 수정
      void (async () => {
        const { error, count } = await supabase
          .from("projects")
          .update({ ...inputToRow(input), updated_at: ts }, { count: "exact" })
          .eq("id", id);
        if (error || count === 0) {
          console.error("[ProjectsProvider] UPDATE error:", error ?? "0 rows (RLS?)");
          if (prevProject) setProjects((prev) => prev.map((p) => (p.id === id ? prevProject : p))); // 롤백
          toast.error("프로젝트 수정에 실패했습니다.");
        }
      })();
    },
    [supabase, userId],
  );

  const deleteProject = useCallback(
    (id: string): void => {
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      const snapshot = projectsRef.current;
      setProjects((prev) => prev.filter((p) => p.id !== id)); // 낙관적 삭제
      void (async () => {
        // 이 프로젝트를 참조하는 업무들의 project_id 를 먼저 NULL 처리
        const { error: tasksError } = await supabase
          .from("tasks")
          .update({ project_id: null })
          .eq("project_id", id);
        if (tasksError) console.error("[ProjectsProvider] tasks UPDATE error:", tasksError);

        const { error, count } = await supabase
          .from("projects")
          .delete({ count: "exact" })
          .eq("id", id);
        if (error || count === 0) {
          console.error("[ProjectsProvider] DELETE error:", error ?? "0 rows (RLS?)");
          setProjects(() => snapshot); // 롤백
          toast.error("프로젝트 삭제에 실패했습니다.");
        }
      })();
    },
    [supabase, userId],
  );

  const getProjectById = useCallback(
    (id: string): Project | undefined => projects.find((p) => p.id === id),
    [projects],
  );

  // 벌크 작업 후 전체 페이지 새로고침 없이 재동기화하기 위한 refetch
  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) {
      setProjects([]);
      return;
    }
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[ProjectsProvider] refresh SELECT error:", error);
      return;
    }
    if (data) setProjects((data as Record<string, unknown>[]).map(rowToProject));
  }, [supabase, userId]);

  const value = useMemo(
    () => ({ projects, loading, addProject, updateProject, deleteProject, getProjectById, refresh }),
    [projects, loading, addProject, updateProject, deleteProject, getProjectById, refresh],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}

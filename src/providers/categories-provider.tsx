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
import { TASK_CATEGORY_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

export interface Category {
  value: string;
  label: string;
}

const STORAGE_KEY = "bt_categories";

function getDefaultCategories(): Category[] {
  return Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
}

// ─── 로컬 캐시 (오프라인 / 마이그레이션 적용 전 폴백) ───────────────────────────

function loadLocal(): Category[] {
  if (typeof window === "undefined") return getDefaultCategories();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Category[];
  } catch {}
  return getDefaultCategories();
}

function persistLocal(categories: Category[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch {}
}

// ─── Supabase 매핑 ─────────────────────────────────────────────────────────────

function rowToCategory(row: Record<string, unknown>): Category {
  return { value: row.value as string, label: row.label as string };
}

function categoryToRow(cat: Category, userId: string, sortOrder: number) {
  return { user_id: userId, value: cat.value, label: cat.label, sort_order: sortOrder };
}

interface CategoriesContextValue {
  categories: Category[];
  addCategory: (label: string) => void;
  updateCategory: (value: string, label: string) => void;
  deleteCategory: (value: string) => void;
  reorderCategories: (orderedValues: string[]) => void;
  getCategoryLabel: (value: string) => string;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => loadLocal());
  const supabase = useMemo(() => createClient(), []);
  const { userId } = useAuth();
  // Supabase categories 테이블 사용 가능 여부. 마이그레이션 미적용 시 false 로 두고
  // 로컬 전용으로 동작(원격 쓰기 시도 자체를 생략)한다.
  const remoteRef = useRef(false);
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    if (!userId) {
      remoteRef.current = false;
      return;
    }
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        // 테이블 부재(마이그레이션 미적용) 또는 권한 문제 → 로컬 전용 유지
        console.warn("[CategoriesProvider] 원격 카테고리 사용 불가, 로컬 전용으로 동작:", error.message);
        remoteRef.current = false;
        return;
      }
      remoteRef.current = true;
      const remote = (data as Record<string, unknown>[]).map(rowToCategory);
      if (remote.length > 0) {
        setCategories(remote);
        persistLocal(remote);
      } else {
        // 신규 사용자: 현재 로컬/기본 카테고리를 원격에 시드
        const seed = loadLocal();
        const { error: seedError } = await supabase
          .from("categories")
          .insert(seed.map((c, i) => categoryToRow(c, userId, i)));
        if (seedError) console.error("[CategoriesProvider] seed INSERT error:", seedError);
        setCategories(seed);
        persistLocal(seed);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, supabase]);

  const addCategory = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const value = `custom_${crypto.randomUUID().slice(0, 8)}`;
      const sortOrder = categories.length;
      setCategories((prev) => {
        const next = [...prev, { value, label: trimmed }];
        persistLocal(next);
        return next;
      });
      if (remoteRef.current && userId) {
        void supabase
          .from("categories")
          .insert(categoryToRow({ value, label: trimmed }, userId, sortOrder))
          .then(({ error }) => {
            if (error) console.error("[CategoriesProvider] INSERT error:", error);
          });
      }
    },
    [categories.length, supabase, userId],
  );

  const updateCategory = useCallback(
    (value: string, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      setCategories((prev) => {
        const next = prev.map((c) => (c.value === value ? { ...c, label: trimmed } : c));
        persistLocal(next);
        return next;
      });
      if (remoteRef.current && userId) {
        void supabase
          .from("categories")
          .update({ label: trimmed })
          .eq("user_id", userId)
          .eq("value", value)
          .then(({ error }) => {
            if (error) console.error("[CategoriesProvider] UPDATE error:", error);
          });
      }
    },
    [supabase, userId],
  );

  const deleteCategory = useCallback(
    (value: string) => {
      setCategories((prev) => {
        const next = prev.filter((c) => c.value !== value);
        persistLocal(next);
        return next;
      });
      if (remoteRef.current && userId) {
        void supabase
          .from("categories")
          .delete()
          .eq("user_id", userId)
          .eq("value", value)
          .then(({ error }) => {
            if (error) console.error("[CategoriesProvider] DELETE error:", error);
          });
      }
    },
    [supabase, userId],
  );

  const reorderCategories = useCallback(
    (orderedValues: string[]) => {
      const prev = categoriesRef.current;
      const byValue = new Map(prev.map((c) => [c.value, c]));
      const next: Category[] = [];
      for (const v of orderedValues) {
        const c = byValue.get(v);
        if (c) next.push(c);
      }
      // orderedValues 에 누락된 항목은 기존 순서로 뒤에 보존
      for (const c of prev) if (!next.includes(c)) next.push(c);
      setCategories(next);
      persistLocal(next);
      if (remoteRef.current && userId) {
        void supabase
          .from("categories")
          .upsert(
            next.map((c, i) => categoryToRow(c, userId, i)),
            { onConflict: "user_id,value" },
          )
          .then(({ error }) => {
            if (error) console.error("[CategoriesProvider] reorder upsert error:", error);
          });
      }
    },
    [supabase, userId],
  );

  const getCategoryLabel = useCallback(
    (value: string) => categories.find((c) => c.value === value)?.label ?? value,
    [categories],
  );

  const ctx = useMemo(
    () => ({ categories, addCategory, updateCategory, deleteCategory, reorderCategories, getCategoryLabel }),
    [categories, addCategory, updateCategory, deleteCategory, reorderCategories, getCategoryLabel],
  );

  return <CategoriesContext.Provider value={ctx}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}

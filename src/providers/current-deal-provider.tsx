"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// 현재 작업 중인 양수도 건(딜) 선택 상태. 초기 선택 화면(/select)에서 고르고,
// 대시보드/체크리스트 등은 이 딜로 스코프된다. 선택은 이 브라우저에 저장된다.
const STORAGE_KEY = "bt:current-deal";

interface CurrentDealContextValue {
  /** 선택된 양수도 건 id (없으면 null) */
  dealId: string | null;
  /** localStorage 읽기를 마쳤는지 (초기 깜빡임/잘못된 리다이렉트 방지) */
  ready: boolean;
  setDeal: (id: string | null) => void;
}

const CurrentDealContext = createContext<CurrentDealContextValue | null>(null);

export function CurrentDealProvider({ children }: { children: ReactNode }) {
  const [dealId, setDealId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 마이크로태스크로 지연(effect 내 동기 setState 회피 — 프로젝트 공통 패턴)
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setDealId(stored);
      } catch {
        // 무시
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const setDeal = useCallback((id: string | null) => {
    setDealId(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
  }, []);

  const value = useMemo<CurrentDealContextValue>(
    () => ({ dealId, ready, setDeal }),
    [dealId, ready, setDeal],
  );

  return (
    <CurrentDealContext.Provider value={value}>{children}</CurrentDealContext.Provider>
  );
}

export function useCurrentDeal(): CurrentDealContextValue {
  const ctx = useContext(CurrentDealContext);
  if (!ctx) throw new Error("useCurrentDeal must be used within CurrentDealProvider");
  return ctx;
}

"use client";

import { useEffect, useState } from "react";

// 현재 사용자의 관리자 여부(서버 판정). 파괴적/관리 작업 UI 게이팅에 사용.
export function useIsAdmin(): { isAdmin: boolean; ready: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const data = (await res.json()) as { isAdmin?: boolean };
        if (active) setIsAdmin(Boolean(data.isAdmin));
      } catch {
        if (active) setIsAdmin(false);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { isAdmin, ready };
}

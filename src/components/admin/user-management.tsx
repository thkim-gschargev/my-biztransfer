"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { UsersIcon, KeyRoundIcon, Trash2Icon, RefreshCwIcon } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
}

type View = "loading" | "hidden" | "unconfigured" | "ready";

function genPassword(len = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function fmt(dt: string | null): string {
  if (!dt) return "—";
  return dt.replace("T", " ").slice(0, 16);
}

export function UserManagement() {
  const [view, setView] = useState<View>("loading");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [busy, setBusy] = useState(false);

  // 생성 폼
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // 복사용 자격증명(이메일 / 비밀번호). 발급·재설정 시 설정되고 "복사" 버튼으로 클립보드에 복사.
  const [noticeCopy, setNoticeCopy] = useState<string | null>(null);

  async function copyNotice() {
    if (!noticeCopy) return;
    try {
      await navigator.clipboard.writeText(noticeCopy);
      setNotice((n) => (n ? `${n} (복사됨)` : n));
    } catch {
      // 클립보드 접근 불가 시 무시(사용자가 수동 선택 가능)
    }
  }

  // 비밀번호 재설정 다이얼로그
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.status === 403) {
        setView("hidden");
        return;
      }
      if (res.status === 503) {
        setView("unconfigured");
        return;
      }
      if (!res.ok) {
        setView("hidden");
        return;
      }
      const data = (await res.json()) as { users: AdminUser[]; adminEmail: string };
      setUsers(data.users);
      setAdminEmail(data.adminEmail);
      setView("ready");
    } catch {
      setView("hidden");
    }
  }, []);

  useEffect(() => {
    // 마이크로태스크로 지연 호출(effect 내 동기 setState 회피 — 프로젝트 공통 패턴)
    void Promise.resolve().then(load);
  }, [load]);

  async function handleCreate() {
    setFormError(null);
    setNotice(null);
    if (!newEmail.trim() || newPassword.length < 6) {
      setFormError("이메일과 6자 이상 비밀번호를 입력하세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "계정 생성에 실패했습니다.");
        return;
      }
      setNotice(
        `계정 발급 완료: ${newEmail.trim()} / 비밀번호: ${newPassword} — 담당자에게 전달하세요.`,
      );
      setNoticeCopy(`${newEmail.trim()} / ${newPassword}`);
      setNewEmail("");
      setNewPassword("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSubmit() {
    if (!resetTarget) return;
    setResetError(null);
    if (resetPassword.length < 6) {
      setResetError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetTarget.id, password: resetPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setResetError(data.error ?? "비밀번호 재설정에 실패했습니다.");
        return;
      }
      setNotice(
        `비밀번호 재설정 완료: ${resetTarget.email} / 새 비밀번호: ${resetPassword} — 담당자에게 전달하세요.`,
      );
      setNoticeCopy(`${resetTarget.email} / ${resetPassword}`);
      setResetTarget(null);
      setResetPassword("");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNotice(data.error ?? "삭제에 실패했습니다.");
      } else {
        setNotice(`삭제 완료: ${deleteTarget.email}`);
        await load();
      }
    } finally {
      setDeleteTarget(null);
      setBusy(false);
    }
  }

  // 비관리자/로딩/판단불가에서는 카드 자체를 숨긴다.
  if (view === "loading" || view === "hidden") return null;

  if (view === "unconfigured") {
    return (
      <Card className="border-amber-300/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            팀원 계정 관리
          </CardTitle>
          <CardDescription className="text-xs">
            관리자 기능이 아직 설정되지 않았습니다. 서버 환경변수{" "}
            <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> 와{" "}
            <span className="font-mono">ADMIN_EMAILS</span> 를 설정한 뒤 재시작/재배포하세요.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            팀원 계정 관리
            <span className="ml-1 text-xs font-normal text-muted-foreground">관리자 전용</span>
          </CardTitle>
          <CardDescription className="text-xs">
            담당자 계정을 직접 발급하고 비밀번호를 재설정/삭제할 수 있습니다. 발급한
            이메일·비밀번호를 담당자에게 직접 전달하세요. (현재 관리자: {adminEmail})
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* 계정 발급 폼 */}
          <div className="rounded-lg border bg-muted/30 p-3 flex flex-col gap-2">
            <span className="text-xs font-medium">새 계정 발급</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="담당자 이메일"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="sm:flex-1"
              />
              <div className="flex gap-2 sm:w-[320px]">
                <Input
                  type="text"
                  placeholder="비밀번호 (6자 이상)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword(genPassword())}
                  title="무작위 비밀번호 생성"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  생성
                </Button>
              </div>
              <Button onClick={() => void handleCreate()} disabled={busy}>
                발급
              </Button>
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>

          {notice && (
            <div className="flex items-start gap-2 rounded-md bg-green-500/10 px-3 py-2">
              <p className="flex-1 text-xs text-green-700 dark:text-green-400 break-all">
                {notice}
              </p>
              {noticeCopy && (
                <button
                  type="button"
                  onClick={() => void copyNotice()}
                  className="shrink-0 rounded border border-green-600/30 px-2 py-1 text-xs text-green-700 hover:bg-green-500/10 dark:text-green-400"
                >
                  복사
                </button>
              )}
            </div>
          )}

          {/* 계정 목록 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">계정 {users.length}개</span>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCwIcon className="h-3 w-3" />
                새로고침
              </button>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-medium">{u.email}</span>
                {u.email.toLowerCase() === adminEmail.toLowerCase() && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                    관리자
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  최근 로그인 {fmt(u.lastSignInAt)}
                </span>
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setResetTarget(u);
                      setResetPassword("");
                      setResetError(null);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <KeyRoundIcon className="h-3.5 w-3.5" />
                    비밀번호 재설정
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(u)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 재설정 다이얼로그 */}
      <Dialog
        open={resetTarget !== null}
        onOpenChange={(o) => {
          if (!o) setResetTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>비밀번호 재설정 — {resetTarget?.email}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="새 비밀번호 (6자 이상)"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResetPassword(genPassword())}
              >
                <RefreshCwIcon className="h-4 w-4" />
                생성
              </Button>
            </div>
            {resetError && <p className="text-xs text-destructive">{resetError}</p>}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>취소</DialogClose>
            <Button onClick={() => void handleResetSubmit()} disabled={busy}>
              재설정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="계정 삭제"
        description={`"${deleteTarget?.email ?? ""}" 계정을 삭제합니다. 해당 담당자는 더 이상 로그인할 수 없습니다. 계속하시겠습니까?`}
        confirmLabel="삭제"
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}

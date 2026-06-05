"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // 복구 링크 → /auth/callback 이 코드를 세션으로 교환한 뒤 이 페이지로 이동한다.
  // 유효한 세션이 있어야 비밀번호를 변경할 수 있다.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setStatus(session ? "ready" : "invalid");
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("비밀번호가 변경되었습니다. 잠시 후 이동합니다.");
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-app flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-md">
            <ClipboardList className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold">양수도 사업 관제판</h1>
          <p className="text-sm text-muted-foreground">업무 관제판</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">새 비밀번호 설정</CardTitle>
            <CardDescription className="text-xs">
              {status === "invalid"
                ? "재설정 링크가 유효하지 않거나 만료되었습니다."
                : "사용할 새 비밀번호를 입력하세요."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "checking" && (
              <p className="text-sm text-muted-foreground">확인 중…</p>
            )}

            {status === "invalid" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  비밀번호 찾기를 다시 시도해 주세요.
                </p>
                <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                  로그인 화면으로
                </Link>
              </div>
            )}

            {status === "ready" && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Input
                  type="password"
                  placeholder="새 비밀번호 (6자 이상)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                {message && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {message}
                  </p>
                )}
                <Button type="submit" disabled={loading || message !== null}>
                  {loading ? "처리 중..." : "비밀번호 변경"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

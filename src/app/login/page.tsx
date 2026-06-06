"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Mode = "login" | "signup" | "reset";

const TITLES: Record<Mode, string> = {
  login: "로그인",
  signup: "회원가입",
  reset: "비밀번호 찾기",
};

const DESCRIPTIONS: Record<Mode, string> = {
  login: "이메일과 비밀번호로 로그인하세요.",
  signup: "이메일과 비밀번호로 계정을 만드세요.",
  reset: "가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.",
};

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(
          "회원가입이 완료되었습니다. 이메일을 확인하여 계정을 인증해 주세요.",
        );
      } else {
        // reset: 비밀번호 재설정 메일 전송
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        });
        if (error) throw error;
        setMessage(
          "비밀번호 재설정 링크를 이메일로 보냈습니다. 받은 편지함을 확인해 주세요.",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      if (msg === "Invalid login credentials") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (msg.includes("already registered")) {
        setError("이미 가입된 이메일입니다. 로그인해 주세요.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = loading
    ? "처리 중..."
    : mode === "login"
      ? "로그인"
      : mode === "signup"
        ? "회원가입"
        : "재설정 메일 보내기";

  return (
    <div className="bg-app flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-md">
            <ClipboardList className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold">양수도 사업 관제판</h1>
          <p className="text-sm text-muted-foreground">EV 충전기 운영권 양수도 체크리스트</p>
        </div>

        {/* 폼 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{TITLES[mode]}</CardTitle>
            <CardDescription className="text-xs">
              {DESCRIPTIONS[mode]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {mode !== "reset" && (
                <Input
                  type="password"
                  placeholder="비밀번호 (6자 이상)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              )}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="self-end text-xs text-muted-foreground underline hover:text-foreground"
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
              {message && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {message}
                </p>
              )}
              <Button type="submit" disabled={loading}>
                {submitLabel}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 모드 전환 */}
        <p className="text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <>
              계정이 없으신가요?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="underline hover:text-foreground"
              >
                회원가입
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              이미 계정이 있으신가요?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="underline hover:text-foreground"
              >
                로그인
              </button>
            </>
          ) : (
            <>
              비밀번호가 기억나셨나요?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="underline hover:text-foreground"
              >
                로그인으로 돌아가기
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

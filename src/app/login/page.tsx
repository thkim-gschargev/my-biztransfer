"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      if (!isSupabaseConfigured || /failed to fetch|networkerror|load failed/i.test(msg)) {
        setError(
          "서버에 연결하지 못했습니다. Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)가 설정된 상태에서 앱을 실행 중인지 확인해 주세요. (로컬: .env.local 저장 후 개발 서버 재시작 / 배포: Vercel 환경변수 등록 후 재배포)",
        );
      } else if (msg === "Invalid login credentials") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다. 관리자에게 계정 발급을 요청하세요.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

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

        {/* Supabase 미설정 경고 */}
        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Supabase 환경변수가 감지되지 않았습니다. 로그인이 동작하지 않습니다.
            <br />
            <span className="font-mono">.env.local</span> 설정 후 개발 서버를 재시작(배포 시 Vercel 환경변수 등록)해 주세요.
          </div>
        )}

        {/* 로그인 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">로그인</CardTitle>
            <CardDescription className="text-xs">
              발급받은 이메일과 비밀번호로 로그인하세요.
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
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "처리 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 안내 */}
        <p className="text-center text-xs text-muted-foreground">
          계정이 필요하면 관리자에게 발급을 요청하세요.
        </p>
      </div>
    </div>
  );
}

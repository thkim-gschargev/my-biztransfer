import "server-only";
import { createClient } from "@/lib/supabase/server";

// ADMIN_EMAILS(서버 전용, 콤마 구분)에 등록된 이메일만 관리자로 간주한다.
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * 현재 로그인 사용자가 관리자이면 { id, email } 반환, 아니면 null.
 * - ADMIN_EMAILS 미설정이면 누구도 관리자가 아니다(기본 거부).
 */
export async function getCurrentAdmin(): Promise<{ id: string; email: string } | null> {
  const allow = adminEmails();
  if (allow.length === 0) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!user || !email || !allow.includes(email)) return null;
  return { id: user.id, email };
}

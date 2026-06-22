import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 오픈 리다이렉트 방지: 동일 출처 내부 경로(`/path`)만 허용.
  // `//host`, `/\host`, `@host` 등 외부로 빠질 수 있는 값은 거부하고 "/" 로 대체.
  const nextParam = searchParams.get("next");
  const next = nextParam && /^\/(?![/\\])/.test(nextParam) ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

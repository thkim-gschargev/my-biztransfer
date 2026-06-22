import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // 환경변수 미설정 처리: 프로덕션에서는 보호 경로를 막고(fail-closed) 로그인으로 보낸다.
  // 개발/프리뷰에서는 통과시켜 로컬 개발 편의를 유지한다.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { pathname } = request.nextUrl;
    const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/auth");
    if (process.env.NODE_ENV === "production" && !isAuthPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/auth");

  // 비로그인 상태에서 보호된 경로 접근 시 로그인 페이지로 이동
  if (!user && !isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 로그인 상태에서 로그인 페이지 접근 시 대시보드로 이동.
  // 단, /auth/* (비밀번호 재설정 등 복구 세션 흐름)는 로그인 상태여도 접근을 허용한다.
  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

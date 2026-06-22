import { createBrowserClient } from "@supabase/ssr";

// 빌드 시 정적 프리렌더 단계에서는 NEXT_PUBLIC_* 환경변수가 없을 수 있다.
// 이때 createBrowserClient 가 throw 하여 빌드가 깨지지 않도록 안전한 플레이스홀더로
// 대체한다. 실제 런타임(로컬/Vercel)에서는 환경변수가 주입되어 정상 동작한다.
// ※ 운영 배포 시 Vercel 프로젝트에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
//    를 반드시 설정해야 한다(미설정 시 인증/데이터가 동작하지 않음).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다. " +
      "플레이스홀더로 대체합니다(빌드/프리렌더용). 런타임에는 실제 값이 필요합니다.",
  );
}

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL ?? "https://placeholder.supabase.co",
    SUPABASE_ANON_KEY ?? "placeholder-anon-key",
  );
}

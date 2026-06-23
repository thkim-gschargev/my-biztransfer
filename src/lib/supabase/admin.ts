import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ⚠️ 서버 전용 관리자 클라이언트 (service_role 키 사용).
// service_role 키는 RLS 를 우회하는 강력한 비밀키이므로 절대 브라우저로 노출되면 안 된다.
// - "server-only" import 로 클라이언트 번들 유입을 컴파일 단계에서 차단한다.
// - SUPABASE_SERVICE_ROLE_KEY 는 NEXT_PUBLIC_ 접두사가 없어 클라이언트에 주입되지 않는다.
// 미설정 시 null 을 반환하며, 호출부(라우트 핸들러)에서 503 으로 처리한다.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

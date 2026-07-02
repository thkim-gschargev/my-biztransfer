import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/admin-guard";

// 현재 로그인 사용자가 관리자인지 여부. (파괴적 작업 UI 게이팅용)
export async function GET() {
  const admin = await getCurrentAdmin();
  return NextResponse.json({ isAdmin: Boolean(admin) });
}

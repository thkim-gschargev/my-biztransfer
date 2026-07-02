import { NextResponse } from "next/server";
import { getCurrentAdmin, isAdminEmail } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPassword(v: unknown): v is string {
  return typeof v === "string" && v.length >= 6;
}

// 업스트림(GoTrue) 에러 원문은 서버에만 로깅하고, 클라이언트엔 일반화된 메시지만 반환(정보 노출 방지).
function fail(context: string, error: { message: string }, userMsg: string, status = 400) {
  console.error(`[admin/users] ${context}:`, error.message);
  return NextResponse.json({ error: userMsg }, { status });
}

// 관리자 인증 + service-role 클라이언트 확보. 실패 시 { error: NextResponse } 반환(가드).
async function authorize() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  const sb = createAdminClient();
  if (!sb) {
    return {
      error: NextResponse.json({ error: "admin_not_configured" }, { status: 503 }),
    };
  }
  return { admin, sb };
}

// 대상 사용자가 "다른 관리자"인지 확인(본인 제외). 다른 관리자 계정은 변경/삭제 불가.
async function targetIsOtherAdmin(
  sb: NonNullable<ReturnType<typeof createAdminClient>>,
  targetId: string,
  selfId: string,
): Promise<boolean> {
  if (targetId === selfId) return false;
  const { data } = await sb.auth.admin.getUserById(targetId);
  return isAdminEmail(data?.user?.email ?? null);
}

// ─── 팀원 계정 목록 ───────────────────────────────────────────────────────────
export async function GET() {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return fail("listUsers", error, "계정 목록을 불러오지 못했습니다.", 500);
  const users = data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: Boolean(u.email_confirmed_at),
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
  return NextResponse.json({ users, adminEmail: auth.admin.email });
}

// ─── 계정 발급(생성) ──────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!isValidEmail(body.email))
    return NextResponse.json({ error: "유효한 이메일을 입력하세요." }, { status: 400 });
  if (!isValidPassword(body.password))
    return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });

  const { data, error } = await auth.sb.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true, // 이메일 인증 없이 즉시 사용 가능
  });
  if (error) return fail("createUser", error, "이미 존재하는 이메일이거나 계정 생성에 실패했습니다.");
  return NextResponse.json(
    { user: { id: data.user.id, email: data.user.email } },
    { status: 201 },
  );
}

// ─── 비밀번호 재설정 ──────────────────────────────────────────────────────────
export async function PATCH(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  let body: { id?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id)
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!isValidPassword(body.password))
    return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
  if (await targetIsOtherAdmin(auth.sb, body.id, auth.admin.id))
    return NextResponse.json(
      { error: "다른 관리자 계정의 비밀번호는 변경할 수 없습니다." },
      { status: 403 },
    );

  const { error } = await auth.sb.auth.admin.updateUserById(body.id, {
    password: body.password,
  });
  if (error) return fail("updateUserById", error, "비밀번호 재설정에 실패했습니다.");
  return NextResponse.json({ ok: true });
}

// ─── 계정 삭제 ────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id)
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (body.id === auth.admin.id)
    return NextResponse.json(
      { error: "본인 계정은 삭제할 수 없습니다." },
      { status: 400 },
    );
  if (await targetIsOtherAdmin(auth.sb, body.id, auth.admin.id))
    return NextResponse.json(
      { error: "다른 관리자 계정은 삭제할 수 없습니다." },
      { status: 403 },
    );

  const { error } = await auth.sb.auth.admin.deleteUser(body.id);
  if (error) return fail("deleteUser", error, "계정 삭제에 실패했습니다.");
  return NextResponse.json({ ok: true });
}

import { NextRequest } from "next/server";
import { setSession } from "@/lib/session";

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const accessCode = process.env.ACCESS_CODE ?? "";
  if (!accessCode) {
    return Response.json({ ok: false, error: "服务器未配置访问码" }, { status: 500 });
  }
  if (!constantTimeCompare(code, accessCode)) {
    return Response.json({ ok: false, error: "访问码错误" }, { status: 401 });
  }
  await setSession({ gate: true, memberId: null, exp: 0 });
  return Response.json({ ok: true });
}

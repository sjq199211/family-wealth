import { NextRequest } from "next/server";
import { getSession, setSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.gate) {
    return Response.json({ ok: false, error: "未通过进门验证" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const memberId = typeof body.memberId === "number" ? body.memberId : Number(body.memberId);
  if (!Number.isInteger(memberId) || memberId < 1) {
    return Response.json({ ok: false, error: "无效的身份" }, { status: 400 });
  }
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return Response.json({ ok: false, error: "成员不存在" }, { status: 404 });
  }
  await setSession({ gate: true, memberId, exp: session.exp });
  return Response.json({ ok: true, name: member.name });
}

export async function GET() {
  const session = await getSession();
  if (!session?.gate) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const members = await prisma.member.findMany({ orderBy: { id: "asc" } });
  return Response.json({
    currentMemberId: session.memberId,
    members: members.map((m) => ({ id: m.id, name: m.name, role: m.role })),
  });
}

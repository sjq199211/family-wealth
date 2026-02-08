import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMentionNotifications } from "@/lib/notifications";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const row = await prisma.externalReview.findFirst({
    where: { id },
    include: { member: { select: { id: true, name: true } } },
  });
  if (!row) return Response.json({ error: "记录不存在" }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const existing = await prisma.externalReview.findFirst({ where: { id } });
  if (!existing || existing.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权编辑" }, { status: 404 });
  }

  const body = await request.json();
  const data: { title?: string; body?: string; source?: string } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.body === "string") data.body = body.body;
  if (typeof body.source === "string") data.source = body.source;

  const updated = await prisma.externalReview.update({
    where: { id },
    data,
    include: { member: { select: { name: true } } },
  });

  if (data.body !== undefined && data.body) {
    await createMentionNotifications(
      user.id,
      "external_review",
      updated.id,
      `${updated.member.name} 在外部资料《${updated.title}》中提到了你`,
      data.body
    );
  }
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const existing = await prisma.externalReview.findFirst({ where: { id } });
  if (!existing || existing.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权删除" }, { status: 404 });
  }
  await prisma.externalReview.delete({ where: { id } });
  return Response.json({ ok: true });
}

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMentionNotifications } from "@/lib/notifications";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const report = await prisma.report.findFirst({
    where: { id },
    include: {
      member: { select: { id: true, name: true } },
      attachments: true,
    },
  });
  if (!report) return Response.json({ error: "研报不存在" }, { status: 404 });
  return Response.json(report);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const report = await prisma.report.findFirst({ where: { id } });
  if (!report) return Response.json({ error: "研报不存在" }, { status: 404 });
  if (report.memberId !== user.id) {
    return Response.json({ error: "只能编辑自己的研报" }, { status: 403 });
  }

  const body = await request.json();
  const { title, body: text, isWeekly } = body;
  const data: { title?: string; body?: string; isWeekly?: boolean; publishedAt?: Date } = {};
  if (typeof title === "string" && title.trim()) data.title = title.trim();
  if (typeof text === "string") data.body = text;
  if (typeof isWeekly === "boolean") {
    if (isWeekly && user.role !== "weekly_reporter") {
      return Response.json({ error: "无权限设为每周复盘与展望" }, { status: 403 });
    }
    data.isWeekly = isWeekly;
    if (isWeekly) data.publishedAt = new Date();
  }

  const updated = await prisma.report.update({
    where: { id },
    data,
    include: { member: { select: { name: true } }, attachments: true },
  });
  if (updated.isWeekly && data.body !== undefined && data.body) {
    await createMentionNotifications(
      user.id,
      "weekly_strategy",
      updated.id,
      `${updated.member.name} 在《${updated.title}》中提到了你`,
      data.body
    );
  }
  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const report = await prisma.report.findFirst({ where: { id } });
  if (!report) return Response.json({ error: "研报不存在" }, { status: 404 });
  if (report.memberId !== user.id) {
    return Response.json({ error: "只能删除自己的研报" }, { status: 403 });
  }

  await prisma.report.delete({ where: { id } });
  return Response.json({ ok: true });
}

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMentionNotifications } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const isWeekly = searchParams.get("weekly");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const size = Math.min(20, Math.max(1, parseInt(searchParams.get("size") ?? "10", 10)));
  const skip = (page - 1) * size;

  const where = isWeekly === "true" ? { isWeekly: true } : { isWeekly: false };

  const [list, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: isWeekly === "true" ? [{ publishedAt: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
      skip,
      take: size,
      include: {
        member: { select: { id: true, name: true } },
        attachments: { select: { id: true, type: true, originalName: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return Response.json({ list, total, page, size });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (!user.id) return Response.json({ error: "请先在导航栏选择身份" }, { status: 400 });

  const body = await request.json();
  const { title, body: text, isWeekly } = body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "标题不能为空" }, { status: 400 });
  }

  if (isWeekly === true) {
    const canPublish = user.role === "weekly_reporter";
    if (!canPublish) return Response.json({ error: "无权限发布每周复盘与展望" }, { status: 403 });
  }

  const bodyText = typeof text === "string" ? text : "";
  const report = await prisma.report.create({
    data: {
      memberId: user.id,
      title: title.trim(),
      body: bodyText,
      isWeekly: isWeekly === true,
      publishedAt: isWeekly === true ? new Date() : null,
    },
    include: { member: { select: { name: true } } },
  });
  if (isWeekly === true && bodyText) {
    await createMentionNotifications(
      user.id,
      "weekly_strategy",
      report.id,
      `${report.member.name} 在《${report.title}》中提到了你`,
      bodyText
    );
  }
  return Response.json(report);
}

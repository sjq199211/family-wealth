import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMentionNotifications } from "@/lib/notifications";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const list = await prisma.externalReview.findMany({
    orderBy: { createdAt: "desc" },
    include: { member: { select: { id: true, name: true } } },
  });
  return Response.json({ list });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();
  const { title, body: text, source } = body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "标题不能为空" }, { status: 400 });
  }

  const bodyText = typeof text === "string" ? text : "";
  const sourceStr = typeof source === "string" ? source : "";
  const row = await prisma.externalReview.create({
    data: {
      memberId: user.id,
      title: title.trim(),
      body: bodyText,
      source: sourceStr,
    },
    include: { member: { select: { name: true } } },
  });

  if (bodyText) {
    await createMentionNotifications(
      user.id,
      "external_review",
      row.id,
      `${row.member.name} 在外部资料《${row.title}》中提到了你`,
      bodyText
    );
  }
  return Response.json(row);
}

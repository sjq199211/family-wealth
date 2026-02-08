import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMentionNotifications } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const note = await prisma.tradingNote.findFirst({ where: { id } });
  if (!note || note.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权操作" }, { status: 404 });
  }

  const body = await request.json();
  const { content, noteDate } = body;
  const data: { content?: string; noteDate?: Date } = {};
  if (typeof content === "string") data.content = content.trim();
  if (noteDate !== undefined) {
    const d = new Date(noteDate);
    if (!Number.isNaN(d.getTime())) data.noteDate = d;
  }

  const updated = await prisma.tradingNote.update({ where: { id }, data });
  if (data.content !== undefined && data.content) {
    await createMentionNotifications(
      user.id,
      "trading_note",
      updated.id,
      `${user.name} 在交易心得中提到了你`,
      data.content
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

  const note = await prisma.tradingNote.findFirst({ where: { id } });
  if (!note || note.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权操作" }, { status: 404 });
  }
  await prisma.tradingNote.delete({ where: { id } });
  return Response.json({ ok: true });
}

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMentionNotifications } from "@/lib/notifications";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (!user.id) return Response.json({ list: [] });

  const notes = await prisma.tradingNote.findMany({
    orderBy: { noteDate: "desc" },
    include: {
      member: { select: { id: true, name: true } },
      likes: { select: { memberId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { member: { select: { id: true, name: true } } },
      },
    },
  });

  const list = notes.map((n) => ({
    id: n.id,
    memberId: n.memberId,
    memberName: n.member.name,
    content: n.content,
    noteDate: n.noteDate.toISOString(),
    createdAt: n.createdAt.toISOString(),
    likeCount: n.likes.length,
    likedByMe: n.likes.some((l) => l.memberId === user.id),
    comments: n.comments.map((c) => ({
      id: c.id,
      memberId: c.memberId,
      memberName: c.member.name,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  }));
  return Response.json({ list });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (!user.id) return Response.json({ error: "请先在导航栏选择身份" }, { status: 400 });

  const body = await request.json();
  const { content, noteDate } = body;
  if (!content || typeof content !== "string" || !content.trim()) {
    return Response.json({ error: "内容不能为空" }, { status: 400 });
  }
  const date = noteDate ? new Date(noteDate) : new Date();
  if (Number.isNaN(date.getTime())) {
    return Response.json({ error: "日期无效" }, { status: 400 });
  }

  const contentStr = content.trim();
  const note = await prisma.tradingNote.create({
    data: { memberId: user.id, content: contentStr, noteDate: date },
  });
  if (contentStr) {
    await createMentionNotifications(
      user.id,
      "trading_note",
      note.id,
      `${user.name} 在交易心得中提到了你`,
      contentStr
    );
  }
  return Response.json(note);
}

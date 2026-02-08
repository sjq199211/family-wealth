import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const noteId = parseInt((await params).id, 10);
  if (Number.isNaN(noteId)) return Response.json({ error: "无效ID" }, { status: 400 });

  const comments = await prisma.tradingNoteComment.findMany({
    where: { noteId },
    orderBy: { createdAt: "asc" },
    include: { member: { select: { id: true, name: true } } },
  });
  return Response.json({
    list: comments.map((c) => ({
      id: c.id,
      memberId: c.memberId,
      memberName: c.member.name,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const noteId = parseInt((await params).id, 10);
  if (Number.isNaN(noteId)) return Response.json({ error: "无效ID" }, { status: 400 });

  const note = await prisma.tradingNote.findFirst({ where: { id: noteId } });
  if (!note) return Response.json({ error: "心得不存在" }, { status: 404 });

  const body = await request.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) return Response.json({ error: "评论不能为空" }, { status: 400 });

  const comment = await prisma.tradingNoteComment.create({
    data: { memberId: user.id, noteId, content },
    include: { member: { select: { id: true, name: true } } },
  });
  return Response.json({
    id: comment.id,
    memberId: comment.memberId,
    memberName: comment.member.name,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  });
}

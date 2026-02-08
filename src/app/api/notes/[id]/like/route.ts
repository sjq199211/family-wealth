import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const noteId = parseInt((await params).id, 10);
  if (Number.isNaN(noteId)) return Response.json({ error: "无效ID" }, { status: 400 });

  const note = await prisma.tradingNote.findFirst({ where: { id: noteId } });
  if (!note) return Response.json({ error: "心得不存在" }, { status: 404 });

  const existing = await prisma.tradingNoteLike.findUnique({
    where: { memberId_noteId: { memberId: user.id, noteId } },
  });

  if (existing) {
    await prisma.tradingNoteLike.delete({
      where: { id: existing.id },
    });
    return Response.json({ liked: false });
  }
  await prisma.tradingNoteLike.create({
    data: { memberId: user.id, noteId },
  });
  return Response.json({ liked: true });
}

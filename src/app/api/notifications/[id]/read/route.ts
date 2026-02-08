import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const n = await prisma.notification.findFirst({
    where: { id, toMemberId: user.id },
  });
  if (!n) return Response.json({ error: "通知不存在" }, { status: 404 });

  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  return Response.json({ ok: true });
}

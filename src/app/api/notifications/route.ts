import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const [list, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { toMemberId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { fromMember: { select: { name: true } } },
    }),
    prisma.notification.count({ where: { toMemberId: user.id, readAt: null } }),
  ]);

  return Response.json({ list, unreadCount });
}

export async function PATCH() {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { toMemberId: user.id },
    data: { readAt: new Date() },
  });
  return Response.json({ ok: true });
}

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

  const row = await prisma.stockStrategy.findFirst({
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

  const existing = await prisma.stockStrategy.findFirst({ where: { id } });
  if (!existing || existing.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权编辑" }, { status: 404 });
  }

  const body = await request.json();
  const num = (v: unknown) => (v === "" || v == null ? null : Number(v));
  const data: Record<string, unknown> = {};
  if (typeof body.symbol === "string" && body.symbol.trim()) data.symbol = body.symbol.trim();
  if (body.entryLevel !== undefined) data.entryLevel = num(body.entryLevel);
  if (body.addPosition !== undefined) data.addPosition = num(body.addPosition);
  if (body.reducePosition !== undefined) data.reducePosition = num(body.reducePosition);
  if (body.stopLoss !== undefined) data.stopLoss = num(body.stopLoss);
  if (body.takeProfit !== undefined) data.takeProfit = num(body.takeProfit);
  if (typeof body.positionMgmt === "string") data.positionMgmt = body.positionMgmt;
  if (body.difficulty != null) data.difficulty = Math.min(5, Math.max(1, Number(body.difficulty)));
  if (typeof body.trendComment === "string") data.trendComment = body.trendComment;

  const updated = await prisma.stockStrategy.update({
    where: { id },
    data,
    include: { member: { select: { name: true } } },
  });

  const trendComment = data.trendComment;
  if (typeof trendComment === "string" && trendComment) {
    await createMentionNotifications(
      user.id,
      "stock_strategy",
      updated.id,
      `${updated.member.name} 在个股策略「${updated.symbol}」中提到了你`,
      trendComment
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

  const existing = await prisma.stockStrategy.findFirst({ where: { id } });
  if (!existing || existing.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权删除" }, { status: 404 });
  }
  await prisma.stockStrategy.delete({ where: { id } });
  return Response.json({ ok: true });
}

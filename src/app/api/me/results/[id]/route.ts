import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const row = await prisma.tradingResult.findFirst({ where: { id } });
  if (!row || row.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权操作" }, { status: 404 });
  }

  const body = await request.json();
  const data: {
    tradeDate?: Date;
    symbol?: string;
    side?: string;
    amount?: number | null;
    pnl?: number | null;
    note?: string;
  } = {};
  if (body.tradeDate !== undefined) {
    const d = new Date(body.tradeDate);
    if (!Number.isNaN(d.getTime())) data.tradeDate = d;
  }
  if (typeof body.symbol === "string") data.symbol = body.symbol.trim();
  if (typeof body.side === "string") data.side = body.side;
  if (body.amount !== undefined) data.amount = body.amount == null ? null : Number(body.amount);
  if (body.pnl !== undefined) data.pnl = body.pnl == null ? null : Number(body.pnl);
  if (typeof body.note === "string") data.note = body.note;

  const updated = await prisma.tradingResult.update({ where: { id }, data });
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

  const row = await prisma.tradingResult.findFirst({ where: { id } });
  if (!row || row.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权操作" }, { status: 404 });
  }
  await prisma.tradingResult.delete({ where: { id } });
  return Response.json({ ok: true });
}

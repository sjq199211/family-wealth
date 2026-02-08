import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (!user.id) return Response.json({ list: [] });

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: { memberId: number; symbol?: string; tradeDate?: { gte?: Date; lte?: Date } } = {
    memberId: user.id,
  };
  if (symbol) where.symbol = symbol;
  if (from || to) {
    where.tradeDate = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) where.tradeDate.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) where.tradeDate.lte = d;
    }
  }

  const list = await prisma.tradingResult.findMany({
    where,
    orderBy: { tradeDate: "desc" },
  });
  return Response.json({ list });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (!user.id) return Response.json({ error: "请先在导航栏选择身份" }, { status: 400 });

  const body = await request.json();
  const { tradeDate, symbol, side, amount, pnl, note } = body;
  const date = tradeDate ? new Date(tradeDate) : new Date();
  if (Number.isNaN(date.getTime())) {
    return Response.json({ error: "交易日期无效" }, { status: 400 });
  }

  const result = await prisma.tradingResult.create({
    data: {
      memberId: user.id,
      tradeDate: date,
      symbol: typeof symbol === "string" ? symbol.trim() : "",
      side: typeof side === "string" ? side : "",
      amount: typeof amount === "number" ? amount : typeof amount === "string" ? parseFloat(amount) : null,
      pnl: typeof pnl === "number" ? pnl : typeof pnl === "string" ? parseFloat(pnl) : null,
      note: typeof note === "string" ? note : "",
    },
  });
  return Response.json(result);
}

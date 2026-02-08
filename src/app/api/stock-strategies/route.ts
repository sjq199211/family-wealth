import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMentionNotifications } from "@/lib/notifications";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const list = await prisma.stockStrategy.findMany({
    orderBy: { updatedAt: "desc" },
    include: { member: { select: { id: true, name: true } } },
  });
  return Response.json({ list });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();
  const { symbol, entryLevel, addPosition, reducePosition, stopLoss, takeProfit, positionMgmt, difficulty, trendComment } = body;
  if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
    return Response.json({ error: "请填写标的" }, { status: 400 });
  }
  const diff = difficulty != null ? Math.min(5, Math.max(1, Number(difficulty))) : 1;
  const num = (v: unknown) => (v != null && v !== "" ? Number(v) : null);

  const row = await prisma.stockStrategy.create({
    data: {
      memberId: user.id,
      symbol: symbol.trim(),
      entryLevel: num(entryLevel),
      addPosition: num(addPosition),
      reducePosition: num(reducePosition),
      stopLoss: num(stopLoss),
      takeProfit: num(takeProfit),
      positionMgmt: typeof positionMgmt === "string" ? positionMgmt : "",
      difficulty: diff,
      trendComment: typeof trendComment === "string" ? trendComment : "",
    },
    include: { member: { select: { name: true } } },
  });

  if (row.trendComment) {
    await createMentionNotifications(
      user.id,
      "stock_strategy",
      row.id,
      `${row.member.name} 在个股策略「${row.symbol}」中提到了你`,
      row.trendComment
    );
  }
  return Response.json(row);
}

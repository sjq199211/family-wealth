import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StockStrategyForm from "../../StockStrategyForm";

export default async function EditStockStrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) return null;

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) notFound();

  const s = await prisma.stockStrategy.findFirst({
    where: { id },
  });
  if (!s || s.memberId !== user.id) notFound();

  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">编辑个股策略</h1>
      <StockStrategyForm
        strategy={{
          id: s.id,
          symbol: s.symbol,
          entryLevel: s.entryLevel,
          addPosition: s.addPosition,
          reducePosition: s.reducePosition,
          stopLoss: s.stopLoss,
          takeProfit: s.takeProfit,
          positionMgmt: s.positionMgmt ?? "",
          difficulty: s.difficulty,
          trendComment: s.trendComment,
        }}
        members={members}
      />
    </div>
  );
}

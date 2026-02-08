import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StockStrategyForm from "../StockStrategyForm";

export default async function NewStockStrategyPage() {
  const user = await getSession();
  if (!user) return null;
  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">添加个股策略</h1>
      <StockStrategyForm members={members} />
    </div>
  );
}

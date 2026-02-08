import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ContentWithMentions from "@/components/ContentWithMentions";
import DeleteStrategyButton from "../DeleteStrategyButton";

export default async function StockStrategyDetailPage({
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
    include: { member: { select: { id: true, name: true } } },
  });
  if (!s) notFound();

  const isOwner = s.memberId === user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/stock-strategies" className="text-sm text-[var(--text-muted)] hover:underline">
          ← 返回
        </Link>
        {isOwner && (
          <div className="flex items-center gap-3">
            <Link href={`/stock-strategies/${id}/edit`} className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
              编辑
            </Link>
            <DeleteStrategyButton strategyId={id} symbol={s.symbol} />
          </div>
        )}
      </div>
      <article className="overflow-visible rounded border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{s.symbol}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{s.member.name}</p>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">入场位</dt><dd className="mt-0.5">{s.entryLevel != null ? s.entryLevel : "—"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">加仓位</dt><dd className="mt-0.5">{s.addPosition != null ? s.addPosition : "—"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">减仓位</dt><dd className="mt-0.5">{s.reducePosition != null ? s.reducePosition : "—"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">止损位</dt><dd className="mt-0.5">{s.stopLoss != null ? s.stopLoss : "—"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">出场位</dt><dd className="mt-0.5">{s.takeProfit != null ? s.takeProfit : "—"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">操作难度（1星到5星）</dt><dd className="mt-0.5">{s.difficulty} 星</dd></div>
        </dl>
        {s.positionMgmt && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">仓位管理</h3>
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{s.positionMgmt}</p>
          </div>
        )}
        {s.trendComment && (
          <div className="mt-4 border-t border-[var(--border)] pt-4 overflow-visible">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">个股分析</h3>
            <div className="min-h-[1em] text-[var(--text-secondary)] whitespace-pre-wrap break-words overflow-visible">
              <ContentWithMentions text={s.trendComment} />
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

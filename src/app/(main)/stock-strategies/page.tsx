import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StockStrategiesPage() {
  if (!prisma.stockStrategy) {
    return (
      <div className="rounded border border-amber-600/50 bg-amber-500/10 p-6 text-amber-800 dark:text-amber-200">
        <p className="font-medium">Prisma Client 未包含个股策略模型</p>
        <p className="mt-1 text-sm">请在项目目录运行 <code className="rounded bg-black/10 px-1">npx prisma generate</code> 并<strong>重启开发服务</strong>（重新执行 npm run dev）。</p>
      </div>
    );
  }
  let list: Awaited<ReturnType<typeof prisma.stockStrategy.findMany<{ include: { member: { select: { name: true } } } }>>>;
  try {
    list = await prisma.stockStrategy.findMany({
      orderBy: { updatedAt: "desc" },
      include: { member: { select: { name: true } } },
    });
  } catch (e) {
    console.error("Stock strategies load error:", e);
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
        <p className="font-medium">加载失败</p>
        <p className="mt-1 text-sm">请确认已执行数据库迁移：在项目目录运行 <code className="rounded bg-black/10 px-1">npx prisma db push</code></p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">个股交易策略</h1>
        <Link
          href="/stock-strategies/new"
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-slate-900 hover:bg-[var(--accent-hover)]"
        >
          添加策略
        </Link>
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        为个股设定入场位、加仓/减仓位、止损/出场位、仓位管理、操作难度（1～5 星）与个股分析，支持 @ 成员。
      </p>
      {list.length === 0 ? (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-[var(--text-muted)]">
          暂无策略，
          <Link href="/stock-strategies/new" className="ml-1 font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
            去添加
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--border)] bg-[var(--bg-card)]">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-800/50">
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">标的</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">入场位</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">加仓位</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">减仓位</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">止损位</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">出场位</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">仓位管理</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">操作难度（1星到5星）</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">个股分析</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">发布人</th>
                <th className="px-3 py-2 text-right font-semibold text-[var(--text-primary)]">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--border)] last:border-b-0 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{s.symbol}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{s.entryLevel != null ? s.entryLevel : "—"}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{s.addPosition != null ? s.addPosition : "—"}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{s.reducePosition != null ? s.reducePosition : "—"}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{s.stopLoss != null ? s.stopLoss : "—"}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{s.takeProfit != null ? s.takeProfit : "—"}</td>
                  <td className="px-3 py-2 max-w-[200px] text-left text-[var(--text-muted)] whitespace-pre-wrap break-words line-clamp-4 align-middle" title={s.positionMgmt || undefined}>{s.positionMgmt || "—"}</td>
                  <td className="px-3 py-2 text-center text-[var(--text-secondary)] align-middle">{s.difficulty} 星</td>
                  <td className="px-3 py-2 max-w-[420px] text-[var(--text-muted)] whitespace-pre-wrap break-words" title={s.trendComment ? s.trendComment.replace(/@\[\d+:[^\]]+\]/g, "@") : undefined}>
                    {s.trendComment ? s.trendComment.replace(/@\[\d+:[^\]]+\]/g, "@") : "—"}
                  </td>
                  <td className="px-3 py-2 text-center text-[var(--text-muted)] align-middle">{s.member?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/stock-strategies/${s.id}`} className="font-medium text-[var(--accent-muted)] hover:text-[var(--accent)]">查看</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

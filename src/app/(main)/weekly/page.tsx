import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function WeeklyPage() {
  const user = await getSession();
  if (!user) return null;

  const list = await prisma.report.findMany({
    where: { isWeekly: true },
    orderBy: { publishedAt: "desc" },
    include: { member: { select: { name: true } } },
  });

  const canPublish = user.role === "weekly_reporter";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">每周复盘与展望</h1>
        {canPublish && (
          <Link
            href="/reports/new?weekly=1"
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-slate-900 hover:bg-[var(--accent-hover)] transition-colors"
          >
            发布本周策略
          </Link>
        )}
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        {canPublish ? "主要由基金经理发布每周复盘与展望，支持 @ 成员。" : "由基金经理每周发布，此处为历史记录。"}
      </p>
      {list.length === 0 ? (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-[var(--text-muted)]">
          暂无复盘与展望
          {canPublish && (
            <>
              ，<Link href="/reports/new?weekly=1" className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">去发布</Link>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="block rounded border-l-4 border-l-[var(--accent)] border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <h2 className="font-medium text-[var(--text-primary)]">{r.title}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {r.member.name}
                  {r.publishedAt && ` · ${new Date(r.publishedAt).toLocaleDateString("zh-CN")}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

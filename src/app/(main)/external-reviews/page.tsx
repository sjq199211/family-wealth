import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExternalReviewsPage() {
  let list: { id: number; memberId: number; title: string; body: string; source: string; createdAt: Date; member?: { name: string } | null }[];
  try {
    list = await prisma.externalReview.findMany({
      orderBy: { createdAt: "desc" },
      include: { member: { select: { name: true } } },
    });
  } catch (e) {
    console.error("External reviews load error:", e);
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
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">外部资料</h1>
        <Link
          href="/external-reviews/new"
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-slate-900 hover:bg-[var(--accent-hover)]"
        >
          分享资料
        </Link>
      </div>
      <p className="text-sm text-[var(--text-muted)]">分享外部研报与资料，支持 @ 成员。</p>
      {list.length === 0 ? (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-[var(--text-muted)]">
          暂无内容，
          <Link href="/external-reviews/new" className="ml-1 font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
            去分享
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id}>
              <Link
                href={`/external-reviews/${r.id}`}
                className="block rounded border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <h2 className="font-medium text-[var(--text-primary)]">{r.title}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {r.member?.name ?? "—"}
                  {r.source && ` · ${r.source}`}
                </p>
                {r.body && (
                <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                  {r.body.replace(/@\[\d+:[^\]]+\]/g, "@").slice(0, 120)}
                  {r.body.length > 120 ? "…" : ""}
                </p>
              )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

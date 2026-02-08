import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractTextFromFile } from "@/lib/extractFileText";
import ContentWithMentions from "@/components/ContentWithMentions";
import ExternalReviewWordBlock from "../ExternalReviewWordBlock";
import DeleteExternalReviewButton from "../DeleteExternalReviewButton";

export default async function ExternalReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) return null;

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) notFound();

  const r = await prisma.externalReview.findFirst({
    where: { id },
    include: { member: { select: { id: true, name: true } } },
  });
  if (!r) notFound();

  let originalText = "";
  if (r.wordFilePath) {
    try {
      const fullPath = path.join(process.cwd(), r.wordFilePath);
      const buf = await readFile(fullPath);
      originalText = await extractTextFromFile(r.wordFilePath, buf);
    } catch { /* ignore */ }
  }

  const isOwner = r.memberId === user.id;
  let recommendedSymbols: string[] = [];
  try {
    if (r.aiRecommendedSymbols) recommendedSymbols = JSON.parse(r.aiRecommendedSymbols) as string[];
  } catch { /* ignore */ }
  const stripCode = (s: string) => s.replace(/\s*[（(][^）)]*[）)]\s*$/, "").trim() || s;
  const recommendedNames = recommendedSymbols.map(stripCode);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/external-reviews" className="text-sm text-[var(--text-muted)] hover:underline">
          ← 返回
        </Link>
        {isOwner && (
          <div className="flex items-center gap-3">
            <Link href={`/external-reviews/${id}/edit`} className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
              编辑
            </Link>
            <DeleteExternalReviewButton reviewId={id} title={r.title} />
          </div>
        )}
      </div>
      <article className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{r.title}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {r.member.name}
          {r.source && ` · ${r.source}`}
          {" · "}
          {r.createdAt.toLocaleString("zh-CN")}
        </p>

        {originalText ? (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">原文</h3>
            <div className="max-h-[60vh] overflow-y-auto rounded border border-[var(--border)] bg-slate-100 px-4 py-3 text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap dark:bg-slate-800/50">
              {originalText}
            </div>
          </div>
        ) : null}

        <ExternalReviewWordBlock
          reviewId={id}
          wordFileName={r.wordFileName}
          hasWord={!!r.wordFilePath}
          isOwner={isOwner}
        />

        {(r.aiSummary || recommendedNames.length > 0) && (
          <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
            {r.aiSummary && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">AI 总结</h3>
                <div className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{r.aiSummary}</div>
              </div>
            )}
            {recommendedNames.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">推荐标的</h3>
                <ul className="flex flex-wrap gap-2">
                  {recommendedNames.map((name, i) => (
                    <li key={i} className="rounded bg-slate-700/50 px-2 py-1 text-sm text-[var(--text-primary)]">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-[var(--border)] pt-4 text-[var(--text-secondary)]">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">摘录 / 备注</h3>
          <ContentWithMentions text={r.body || "（无正文）"} />
        </div>
      </article>
    </div>
  );
}

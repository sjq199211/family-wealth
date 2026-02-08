import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ExternalReviewForm from "../../ExternalReviewForm";

export default async function EditExternalReviewPage({
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
  });
  if (!r || r.memberId !== user.id) notFound();

  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">编辑外部资料</h1>
      <p className="text-sm text-[var(--text-muted)]">保存后可在详情页上传原文文件（txt/doc/docx/pdf），并生成 AI 总结与推荐标的。</p>
      <ExternalReviewForm
        review={{ id: r.id, title: r.title, body: r.body, source: r.source }}
        members={members}
      />
    </div>
  );
}

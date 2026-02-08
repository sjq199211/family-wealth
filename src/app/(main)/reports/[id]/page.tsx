import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReportDetail from "../ReportDetail";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) return null;

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) notFound();

  const report = await prisma.report.findFirst({
    where: { id },
    include: {
      member: { select: { id: true, name: true } },
      attachments: true,
    },
  });
  if (!report) notFound();

  const isOwner = report.memberId === user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={report.isWeekly ? "/weekly" : "/reports"} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          ← 返回
        </Link>
        {isOwner && (
          <Link
            href={`/reports/${id}/edit`}
            className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
          >
            编辑
          </Link>
        )}
      </div>
      <ReportDetail report={report} isOwner={isOwner} />
    </div>
  );
}

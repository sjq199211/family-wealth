import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReportEditForm from "../../ReportEditForm";

export default async function ReportEditPage({
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
    include: { attachments: true },
  });
  if (!report || report.memberId !== user.id) notFound();

  const canPublishWeekly = user.role === "weekly_reporter";
  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">编辑</h1>
      <ReportEditForm report={report} canPublishWeekly={canPublishWeekly} members={members} />
    </div>
  );
}

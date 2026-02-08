import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReportNewForm from "../ReportNewForm";

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ weekly?: string }>;
}) {
  const user = await getSession();
  if (!user) return null;
  const canPublishWeekly = user.role === "weekly_reporter";
  const defaultWeekly = (await searchParams).weekly === "1";
  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
        {defaultWeekly ? "发布本周复盘与展望" : "发布内容"}
      </h1>
      <ReportNewForm canPublishWeekly={canPublishWeekly} defaultWeekly={defaultWeekly} members={members} />
    </div>
  );
}

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ExternalReviewForm from "../ExternalReviewForm";

export default async function NewExternalReviewPage() {
  const user = await getSession();
  if (!user) return null;
  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">分享外部资料</h1>
      <ExternalReviewForm members={members} />
    </div>
  );
}

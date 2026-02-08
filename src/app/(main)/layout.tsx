import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MainNav from "./MainNav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/gate");
  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, role: true },
  });
  const needSelectIdentity = user.id === 0;
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <MainNav user={user} members={members} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {needSelectIdentity && (
          <div className="mb-4 rounded border border-amber-600/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            请先点击右上角您的名字以选择身份，才能发布策略、心得与资料。
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
